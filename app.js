var express = require('express');
var http = require('http');
var path = require('path');
var jaded = require('jaded');
var app = express();

// all environments
app.locals.basedir = __dirname;
console.log(app.locals.basedir);
app.set('port', 1234);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(jaded.middleware({
  templatepath: path.join(__dirname, 'templates'),
  ext: '.html',
  notrailingslash: true,
  ignore: ['/@api'],
  wildcards: true
}));
if('development' == app.get('env')) {
  app.use(express.errorHandler());
}
http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

