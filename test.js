ar path = require('path');

var filepath = "/a/b/c.htm";
var dir = path.dirname(filepath);
var file = path.basename(filepath,'.html');
console.log('dir:  '+dir);
console.log('file: '+file);