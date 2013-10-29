var fs = require('fs');
var url = require('url');
var path = require('path');
var mkdirp = require('mkdirp');
var jade = require('jade');
var _ = require('underscore');
var _options = {};
var _infoCache = {};

function initialize(options) {
  _options = options;
  if(!_options.cachepath) {
    _options.cachepath = path.join(options.templatepath, '.cache');
  }
  _options.ext = _options.ext || '.html';
}

function middleware(options) {
  if(options) {
    initialize(options);
  }
  return function(req, res, next) {
    if('GET' != req.method && 'HEAD' != req.method) return next();
    var requestPath = url.parse(req.url).pathname;
    if(_options.ignore && _.some(_options.ignore, function(x) {
      return requestPath.indexOf(x) == 0;
    })) {
      return next();
    }
    console.log('path: ' + requestPath);
    var files;
    var redirect = requestPath[requestPath.length - 1] != '/';
    if(_options.notrailingslash) {
      if(requestPath == '/') {
        redirect = false;
      } else {
        redirect = !redirect;
      }
    }
    var ext = path.extname(requestPath);
    if(ext && ext != _options.ext) {
      return next();
    }
    if(ext) {
      redirect = false;
    }
    var file = path.basename(requestPath, _options.ext);
    var dir = path.dirname(requestPath);
    if(file == 'index') {
      if(dir == '/') {
        file = '';
      }
    }
    if(!file) {
      files = [path.join(dir, 'index')];
    } else if(ext) {
      files = [path.join(dir, file)];
    } else {
      files = [
        path.join(dir, file),
        path.join(dir, file, 'index')
      ];
      if(_options.wildcards) {
        var p = path.join(dir, file);
        while(p !== '/') {
          files.push(p + "_");
          p = path.dirname(p);
        }
        files.push('/_');
      }
    }
    console.log('files: ' + JSON.stringify(files));
    console.log('redirect: ' + redirect);

    function getCandidate(candidates, callback) {
      if(!candidates || candidates.length == 0) {
        return callback();
      }
      var candidate = _.first(candidates);
      var jadePath = path.join(_options.templatepath, candidate + '.jade');
      return fs.stat(jadePath, function(err, jadeStats) {
        if(err) {
          if(!err.code || err.code != 'ENOENT') {
            return callback(err);
          }
          return getCandidate(_.rest(candidates), callback);
        }
        getData(candidate, function(err, data, key) {
          var htmlPath = key
            ? path.join(_options.cachepath, key, candidate + _options.ext)
            : path.join(_options.cachepath, candidate + _options.ext);
          return fs.stat(htmlPath, function(err, htmlStats) {
            if(err) {
              if(!err.code || err.code != 'ENOENT') {
                return callback(err);
              }
            }
            return callback(null, {
              html: {
                path: htmlPath,
                stats: htmlStats
              },
              jade: {
                path: jadePath,
                stats: jadeStats
              },
              data: data || {}
            });
          });
        });
      });
    }

    function getData(candidate, callback) {
      if(!_options.getData) {
        return callback(null, {});
      }
      return _options.getData(req, res, candidate, callback);
    }

    return getCandidate(files, function(err, candidate) {
      if(err) {
        return next(err);
      }
      if(!candidate) {
        console.log('no candidate, not handled');
        return next();
      }
      if(redirect) {
        if(_options.notrailingslash) {
          return res.redirect(301, requestPath.substr(0, requestPath.length - 1));
        }
        return res.redirect(301, requestPath + "/");
      }
      console.log("candidate: " + candidate.html.path);
      return checkCache(candidate, function(err, stale) {
        if(err) {
          return next(err);
        }
        var sendHtml = function() {
          res.sendfile(candidate.html.path, function(err) {
            if(err) {
              return next(err);
            }
          });
        };
        if(!stale) {
          console.log("cache isn't stale, return html");
          return sendHtml();
        }
        console.log('no valid cache, time to gen html');
        return fs.readFile(candidate.jade.path, function(err, jadeStr) {
          if(err) {
            return next(err);
          }
          var options = {
            filename: candidate.jade.path,
            basedir: _options.templatepath
          };
          try {
            var info = jade.resolve(jadeStr, options);
            info.files = flatten(info.dependencies);
            info.data = candidate.data;
            _infoCache[candidate.html.path] = info;
            console.log(JSON.stringify(info.files, null, 2));
            console.log('gen html');
            var html = info.fn(info.data);
            var htmlDir = path.dirname(candidate.html.path);
            return mkdirp(htmlDir, 0755, function(err) {
              if(err) {
                return next(err);
              }
              return fs.writeFile(candidate.html.path, html, 'utf8', function(err) {
                if(err) {
                  return next(err);
                }
                return sendHtml();
              });
            });
          } catch(e) {
            return next(e);
          }
        });
      });
    });
  };
}

function checkCache(candidate, callback) {
  if(!candidate.html.stats) {
    console.log("no html");
    return callback(null, true);
  }
  var info = _infoCache[candidate.html.path];
  if(!info) {
    console.log("no jade info cached yet");
    return callback(null, true);
  }
  if(!objectEquals(candidate.data,info.data)) {
    console.log("data changed");
    return callback(null, true);
  }
  var htmlTime = candidate.html.stats.mtime;
  var iterator = function(files) {
    if(!files || files.length == 0) {
      return callback(null, false);
    }
    return fs.stat(files[0], function(err, stats) {
      if(err) {
        if(!err.code || err.code != 'ENOENT') {
          return callback(err);
        }
        return callback(null, true);
      }
      console.log(files[0] + ": " + stats.mtime + " > " + htmlTime);
      if(stats.mtime > htmlTime) {
        return callback(null, true);
      }
      return iterator(_.rest(files))
    });
  };
  return iterator(info.files);
}

function objectEquals(x, y) {
  if (x instanceof Function) {
    if (y instanceof Function) {
      return x.toString() === y.toString();
    }
    return false;
  }
  if (x === null || x === undefined || y === null || y === undefined) { return x === y; }
  if (x === y || x.valueOf() === y.valueOf()) { return true; }

  // if one of them is date, they must had equal valueOf
  if (x instanceof Date) { return false; }
  if (y instanceof Date) { return false; }

  // if they are not function or strictly equal, they both need to be Objects
  if (!(x instanceof Object)) { return false; }
  if (!(y instanceof Object)) { return false; }

  var p = Object.keys(x);
  return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) ?
    p.every(function (i) { return objectEquals(x[i], y[i]); }) : false;
}

function flatten(files, flattened) {
  flattened = flattened || {};
  _.each(files, function(v, k) {
    if(flattened[k]) {
      return;
    }
    flattened[k] = 1;
    flatten(v, flattened);
  });
  return _.map(flattened, function(v, k) {
    return k
  });
}

module.exports = {
  middleware: middleware,
  initialize: initialize
};