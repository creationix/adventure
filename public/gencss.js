var fs = require('fs');


var js = ['var imagesClasses =\n[ ""'];
var css = fs.readdirSync('tiles').filter(function (filename) {
  if (filename[0] === '.') return;
  if (filename.indexOf('.png') < 0) return;
  return fs.statSync("tiles/" + filename).isFile();
}).map(function (filename, i) {
  var name = filename.substr(0, filename.indexOf('.')).toLowerCase().replace(/ /g, '-');
  js.push(JSON.stringify(name));
  return "." + name + ' { background-image: url("tiles/' + filename + '"); }'
}).join("\n");
js = js.join("\n, ") + "\n];";
css = ".tile { position: absolute; width: 100px; height: 170px; }\n" + css;

fs.writeFileSync("tiles.css", css, 'utf8');
fs.writeFileSync("tiles.js", js, 'utf8');