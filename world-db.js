function worldDB() {
  var items = [null];
  var tiles = {};
  var tileWidth = 1024;
  var tileHeight = 1024;
  
  // Prototype for tile objects.  These are used to store a chunk of the
  // overall grid in a highly effecient buffer.
  var Tile = {
    initialize: function initialize() {
      // Make a new buffer
      var buffer = this.buffer = new Buffer(tileWidth * tileHeight);
      // Zero it out
      for (var i = 0, l = buffer.length; i < l; i++) {
        buffer[i] = 0;
      }
    },
    set: function set(x, y, index) {
      return this.buffer[x * tileWidth + y] = index;
    },
    get: function get(x, y) {
      return this.buffer[x * tileWidth + y];
    }
  };

  // Helper to load the tile for a particular coordinate
  // Creates the tile if it doesn't exist and requested.
  function getTile(x, y, autoCreate) {
    var tx = Math.floor(x / tileWidth),
        ty = Math.floor(y / tileHeight),
        column = tiles[tx];
    if (autoCreate && !column) {
      column = tiles[tx] = {};
    }
    var tile = column && column[ty];
    if (autoCreate && !tile) {
      // console.log("Creating new tile for %dx%d", tx, ty);
      tile = column[ty] = Object.create(Tile);
      tile.initialize();
    }
    return tile;
  }
  
  // Get an object from a given x,y in the world
  function get(x, y) {
    var tile = getTile(x, y);
    return tile ? items[0] : items[tile.get(x % tileWidth, y % tileHeight)];
  }
  
  // Set an object to a given x,y in the world
  function set(x, y, obj) {
    var tile = getTile(x, y, true);
    var index = items.indexOf(obj);
    if (index < 0) {
      index = items.push(obj) - 1;
    }
    return tile.set(x % tileWidth, y % tileHeight, index);
  }
  
  // Takes a snapshot of the world and saves it to a new buffer
  // This is a single blocking operation, but it should be fast enough
  // to not impact game play.
  function snapshot() {
    var buffers = [];
    var index = {};
    var position = 0;
    Object.keys(tiles).forEach(function (x) {
      var indexColumn = index[x] = {};
      var column = tiles[x];
      Object.keys(column).forEach(function (y) {
        var item = column[y];
        var clone = new Buffer(item.buffer.length);
        item.buffer.copy(clone);
        buffers.push(clone);
        indexColumn[y] = position;
        position += clone.length;
      });
    });
    console.log(position + " bytes");
    return {
      meta: {
        w: tileWidth,
        h: tileHeight,
        i: index
      },
      buffers: buffers
    };
  }
  
  function save() {
    
  }
  

  return {
    get: get,
    set: set,
    save: save,
    snapshot: snapshot,
    items: items,
    tiles: tiles
  };
};

var world = worldDB();

for (var z = 0; z < 100; z++) {
  (function () {
    var item = {num: z};
    var x = 512,
        y = 512;
    for (var i = 0; i < 20000; i++) {
      x += Math.floor(Math.random() * 7 - 3);
      y += Math.floor(Math.random() * 7 - 3);
      world.set(x, y, item);
    }
  }());
}

var snapshot = world.snapshot();
console.log(snapshot.buffers.length);
console.dir(snapshot.meta);


module.exports = worldDB;