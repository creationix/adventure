var world = require('./world-db')();

var items = [{}];

function Tile(width, height, buffer) {
  this.width = width || 1000;
  this.height = height || 1000;
  this.buffer = buffer || null;
}
Tile.prototype = {
}
var water = {name:"Water"};
var world = {};

for (var x = 0; x < 50; x++) {
  var column = world[x] = {};
  for (var y = 0; y < 50; y++) {
    var tile = new Tile(1000, 1000);
    tile.initialize(water);
    column[y] = tile;
  }
}

// Takes a snapshot of the world and saves it to a new buffer
// This is a single blocking operation, but it should be fast enough
// to not impact game play. (76ms with 100 1000x1000 tiles)
function takeSnapshot() {
  var buffers = [];
  var index = {};
  var position = 0;
  Object.keys(world).forEach(function (x) {
    var indexColumn = index[x] = {};
    var column = world[x];
    Object.keys(column).forEach(function (y) {
      var item = column[y];
      var clone = new Buffer(item.buffer.length);
      item.buffer.copy(clone);
      buffers.push(clone);
      indexColumn[y] = {
        p: position,
        w: item.width,
        h: item.height
      };
      position += clone.length;
    });
  });
  return {
    buffers: buffers,
    index: index
  };
}
var before = new Date;
var snapshot = takeSnapshot();
console.log("Snapshot took " + (new Date - before) + "ms");

var stream = fs.createWriteStream('world.grids');
snapshot.buffers.forEach(function (buffer) {
  stream.write(buffer);
});
fs.writeFile('world.items', JSON.stringify(items), 'utf8', function () {
  
});
fs.writeFile('world.index', JSON.stringify(snapshot.index), 'utf8', function () {
  
});