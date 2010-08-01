var fs = require('fs'),
    Step = require('step');

function worldDB(filename, tileSize, saveInterval) {
  var items = [null];
  var tiles = {};
  var lock = false,
      dirty = false,
      shutdown = false,
      timeout;

  tileSize = tileSize || 1024;
  // This is a development friendly settings
  // Use something as long as you can safetly afford in a real app.
  saveInterval = saveInterval || 1000;

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
      console.dir({x:x,y:y,index:index});
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
      tile.initialize(tileSize);
    }
    return tile;
  }

  // Get an object from a given x,y in the world
  function get(x, y) {
    var tile = getTile(x, y);
    return tile ? items[tile.get(x % tileSize, y % tileSize)] : items[0];
  }

  // Set an object to a given x,y in the world
  function set(x, y, obj) {
    
    var tile = getTile(x, y, true);
    var index = items.indexOf(obj);
    if (index < 0) {
      index = items.push(obj) - 1;
      if (index > 255) {
        throw new Error("Cannot save more then 256 unique objects in this database");
      }
    }
    var old = tile.get(x % tileSize, y % tileSize);
    console.dir({x:x,y:y,old:old,index:index});
    if (old != index) {
      tile.set(x % tileSize, y % tileSize, index);
      if (!shutdown) {
        dirty = true;
      }
      checkSave();
    }
    return ;
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
      meta: {
        s: tileSize,
        p: index,
        i: items
      },
      buffers: buffers
    };
  }

  function save(callback) {
    Step(
      function writeNewFile() {
        // Get a consistent snapshot of the entire db
        var data = snapshot();

        var stream = fs.createWriteStream('~' + filename);
        stream.addListener('close', this.parallel());
        stream.write(JSON.stringify(data.meta) + "\n", 'utf8');
        data.buffers.forEach(function (buffer) {
          stream.write(buffer);
        });
        stream.end();

      },
      function unlinkOldFile(err) {
        if (err) { callback(err); return; }
        fs.unlink(filename, this);
      },
      function moveFileIn(err) {
        fs.rename('~' + filename, filename, this);
      },
      callback
    );
  }

  function checkSave() {
    if (lock || !dirty) return;
    lock = true;
    dirty = false;
    save(function () {
      console.error(new Date + " - Database Saved");
      if (shutdown) {
        if (dirty) {
          lock = false;
          checkSave();
          return;
        }
        process.exit();
      }
      if (!dirty) {
        lock = false;
        return;
      }
      timeout = setTimeout(function () {
        lock = false;
        checkSave();
      }, saveInterval);
    });
    
  }
  
  function safeShutdown() {
    process.removeListener("SIGINT", safeShutdown);
    process.removeListener("SIGTERM", safeShutdown);
    console.error("SIGNAL DETECTED - saving data...");
    if (timeout) {
      clearTimeout(timeout);
    }
    lock = false;
    shutdown = true;
    checkSave();
  }

  // Save the current data on SIGINT
  process.addListener("SIGINT", safeShutdown);
  process.addListener("SIGTERM", safeShutdown);

  return {
    get: get, // Get an item from the DB
    set: set, // Save an item to the DB
    save: function () { // Force a save
      if (timeout) {
        clearTimeout(timeout);
      }
      lock = false;
      dirty = true;
      checkSave();
    }
  };
};


module.exports = worldDB;