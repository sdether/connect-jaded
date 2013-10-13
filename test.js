var path = require('path');


function analyze(requestPath, _options) {
  console.log('path: ' + requestPath);
  var files;
  var redirect = requestPath[requestPath.length - 1] != '/';
  _options.ext = _options.ext || '.html';
  var ext = path.extname(requestPath);
  if(ext && ext != _options.ext) {
    return console.log("-- not handled: " + ext);
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
  }
  console.log('files: ' + JSON.stringify(files));
  console.log('redirect: ' + redirect);
}
function analyze2(requestPath, _options) {
  console.log('path: ' + requestPath);
  var file, dir;
  var ext = path.extname(requestPath);
  if(_options.ext) {
    if(ext && ext != _options.ext) {
      return console.log("-- not handled: " + ext);
    }
  } else {
    if(ext) {
      return console.log("-- not handled: " + ext);
    }
  }
  file = path.basename(requestPath);
  dir = path.dirname(requestPath);
  console.log('parsed:  ' + JSON.stringify([dir, file]));
}
var paths = ['/', '/index.html', '/foo.htm', '/foo', '/foo.html', '/foo/', '/foo/index.html', '/foo/bar'];
for(var i = 0; i < paths.length; i++) {
  analyze(paths[i], {});
  console.log('');
}
