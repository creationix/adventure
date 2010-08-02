var fs = require('fs');


var css = fs.readFileSync('sprites.txt', 'utf8').split("\n").map(function (name, i) {
  var y = i % 5 * 171, x = Math.floor(i / 5) * 101;
  return "div." + name + '{ background-position: -' + x + 'px -' + y + 'px; }';
}).join("\n");

fs.writeFileSync("../public/tiles.css", css, 'utf8');
