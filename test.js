var worldDB = require('./world-db'),
    Step = require('step'),
    fs = require('fs');

const tileSize = 1024;
const saveInterval = 10000;

var items = [
  {name:"wall"},
  {name:"water"},
  {name:"tree"},
]
function walk(z) {
  var x = tileSize / 2, y = tileSize / 2, item = items[z % items.length];
  for (var j = 0; j < 10; j++) {
    (function () {
      var q = j;
      setTimeout(function () {
        for (var i = 0; i < 100; i++) {
          x += Math.floor(Math.random() * 5 - 2);
          y += Math.floor(Math.random() * 5 - 2);
          world.set(x, y, item);
        }
      }, j * 10);
    }())
  }
}


var world = worldDB("world.db", tileSize, saveInterval);
// Stress test creating lots of data.
for (var z = 0; z < 4000; z++) {
  (function () {
    var i = z;
    setTimeout(function () {
      walk(i);
    }, i * 6);
  }())
}
