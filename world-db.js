var fs = require('fs'),
    Step = require('step');

function worldDB(tileSize) {
  var items = [null];
  var tiles = {};

  tileSize = tileSize || 1024;

  // Prototype for tile objects.  These are used to store a chunk of the
  // overall grid in a highly effecient buffer.
  var Tile = {
    initialize: function initialize() {
      // Make a new buffer
      var buffer = this.buffer = new Buffer(tileSize * tileSize);
      // Zero it out
      for (var i = 0, l = buffer.length; i < l; i++) {
        buffer[i] = 0;
      }
    },
    set: function set(x, y, index) {
      return this.buffer[x * tileSize + y] = index;
    },
    get: function get(x, y) {
      return this.buffer[x * tileSize + y];
    }
  };

  // Helper to load the tile for a particular coordinate
  // Creates the tile if it doesn't exist and requested.
  function getTile(x, y, autoCreate) {
    var tx = Math.floor(x / tileSize),
        ty = Math.floor(y / tileSize),
        column = tiles[tx];
    if (autoCreate && !column) {
      column = tiles[tx] = {};
    }
    var tile = column && column[ty];
    if (autoCreate && !tile) {
      tile = column[ty] = Object.create(Tile);
      tile.initialize();
    }
    return tile;
  }

  // Get an object from a given x,y in the world
  function get(x, y) {
    var tile = getTile(x, y);
    return tile ? items[0] : items[tile.get(x % tileSize, y % tileSize)];
  }

  // Set an object to a given x,y in the world
  function set(x, y, obj) {
    var tile = getTile(x, y, true);
    var index = items.indexOf(obj);
    if (index < 0) {
      index = items.push(obj) - 1;
    }
    return tile.set(x % tileSize, y % tileSize, index);
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
    return {
      meta: new Buffer(JSON.stringify({
        s: tileSize,
        p: index,
        i: items
      })),
      buffers: buffers
    };
  }

  function save(callback) {
    Step(
      function writeNewFile() {
        // Get a consistent snapshot of the entire db
        var data = snapshot();

        // Save the metadata
        fs.writeFile('~world.meta', data.meta, this.parallel());

        // Safe the buffers
        var stream = fs.createWriteStream('~world.grid');
        stream.addListener('close', this.parallel());
        data.buffers.forEach(function (buffer) {
          stream.write(buffer);
        });
        stream.end();

      },
      function unlinkOldFiles(err) {
        if (err) { callback(err); return; }
        fs.unlink('world.grid', this.parallel());
        fs.unlink('world.meta', this.parallel());
      },
      function moveFilesIn(err) {
        fs.rename('~world.grid', 'world.grid', this.parallel());
        fs.rename('~world.meta', 'world.meta', this.parallel());
      },
      callback
    )
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

module.exports = worldDB;