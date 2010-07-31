var fs = require('fs'),
    Step = require('step'),
    Path = require('path');

function Tile(prefix, width, height) {
  this.prefix = prefix || "";
  this.width = width || 1000;
  this.height = height || 1000;
}
Tile.prototype = {
  initialize: function initialize(obj) {
    var width = this.width,
        height = this.height;

    obj = obj || {};

    var items = this.items = [obj];
    var buffer = this.buffer = new Buffer(width * height);
    for (var x = 0; x < width; x++) {
      var base = x * width;
      for (var y = 0; y < height; y++) {
        buffer[base + y] = 0;
      }
    }

  },
  set: function set(x, y, obj) {
    var index = this.items.indexOf(obj);
    if (index < 0) {
      index = this.items.push(obj) - 1;
    }
    this.buffer[x*this.width+y] = index;
  },
  get: function get(x, y) {
    return this.index[this.buffer[x*this.width+y]];
  },
  save: function save(path, callback) {
    var name = this.prefix;
    if (path) {
      name = Path.join(path, name);
    }
    fs.writeFile(name + ".grid", this.buffer, callback);
  }
}
var water = {name:"Water"};
var world = new Tile("world", 10, 10);
world.initialize();
for (var x = 0, w = world.width; x < w; x++) {
  for (var y = 0, h = world.height; y < h; y++) {
    var tile = new Tile(x + "x" + y, 1000, 1000);
    tile.initialize(water);
    world.set(x, y, tile);
  }
}


world.save(__dirname, function (err, filenames) {
  if (err) throw err;
  console.dir(filenames);
});