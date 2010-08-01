var worldDB = require('./world-db'),
    Step = require('step'),
    fs = require('fs');

const tileSize = 235;
const saveInterval = 1000;

var items = [
  {name:"wall"},
  {name:"water"},
  {name:"tree"},
  {name:"grass"},
  {name:"fire"},
  {name:"bridge"},
  {name:"house"},
  {name:"dragon"},
  {name:"ice"}
];

function walk(z) {
  var x = Math.floor(tileSize / 2), y = Math.floor(tileSize / 2), item = items[z % items.length];
  for (var j = 0; j < 30; j++) {
    (function () {
      var q = j;
      setTimeout(function () {
        for (var i = 0; i < 10; i++) {
          x += Math.floor(Math.random() * 5 - 2);
          y += Math.floor(Math.random() * 5 - 2);
          world.set(x, y, item);
        }
      }, j * 10);
    }());
  }
}


var world = worldDB("world.db", tileSize, saveInterval);
// Stress test creating lots of data.
for (var z = 0; z < 10000; z++) {
  (function () {
    var i = z;
    setTimeout(function () {
      walk(i);
    }, i);
  }());
}
