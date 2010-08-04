var fs = require('fs'),
    Step = require('step');

// Reads from a given file descriptor at a specified position and length
// Handles all OS level chunking for you.
// Callback gets (err, buffer)
function fsRead(fd, position, length, callback) {
  var buffer = new Buffer(length),
      offset = 0;

  function readChunk() {
    fs.read(fd, buffer, offset, length - offset, position, function (err, bytesRead) {
      if (err) { callback(err); return; }

      offset += bytesRead;

      if (offset < length) {
        readChunk();
        return;
      }
      callback(null, buffer);
    });
  }
  readChunk();
}


function worldDB(filename, tileSize, saveInterval) {
  var items = [null];
  var tiles = {};
  var lock = false,
      dirty = false,
      shutdown = false,
      timeout;

  function load(filename, callback) {
    var stream = fs.createReadStream(filename);
    var input = "";
    var meta;
    stream.setEncoding('utf8');
    stream.on('error', callback);
    stream.on("data", function (chunk) {
      input += chunk;
      if (chunk.indexOf("\n") >= 0) {
        var json = input.substr(0, input.indexOf("\n") + 1);
        meta = JSON.parse(json);
        var offset = Buffer.byteLength(json);
        var tileSize = meta.s;
        var tiles = [];
        var counter = 0;
        fs.open(filename, "r", 0666, function (err, fd) {
          if (err) { callback(err); return; }
          Object.keys(meta.p).forEach(function (x) {
            var indexColumn = meta.p[x];
            var column = tiles[x] = {};
            Object.keys(indexColumn).forEach(function (y) {
              var indexCell = indexColumn[y];
              var cell = column[y] = {};
              Object.keys(indexCell).forEach(function (z) {
                counter++;
                var tile = cell[z] = Object.create(Tile);
                fsRead(fd, indexCell[z] + offset, tileSize * tileSize, function (err, buffer) {
                  if (err) { callback(err); return; }
                  tile.buffer = buffer;
                  counter--;
                  if (counter === 0) {
                    callback(null, meta, tiles);
                  }
                });
              });
            });
          });
          if (counter === 0) {
            callback(null, meta, tiles);
          }
        });
        stream.destroy();
      }
    });
    stream.on("end", function () {
      if (!meta) {
        callback(new Error("Unexpected end of stream"));
      }
    });

  }


  lock = true;
  load(filename, function (err, m, t) {
    lock = false;
    if (err) {
      if (err.errno === process.ENOENT) {
        console.log("Creating a new database");
        dirty = true;
        checkSave();
        return;
      }
      throw err;
    }
    dirty = false;
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    tiles = t;
    tileSize = m.s;
    items = m.i;
    console.log("%s loaded", filename);
  });

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
      return this.buffer[x * tileSize + y] = index;
    },
    get: function get(x, y) {
      return this.buffer[x * tileSize + y];
    }
  };


  // Helper to load the tile for a particular coordinate
  // Creates the tile if it doesn't exist and requested.
  function getTile(x, y, z, autoCreate) {
    var tx = Math.floor(x / tileSize),
        ty = Math.floor(y / tileSize),
        column = tiles[tx];
    if (autoCreate && !column) {
      column = tiles[tx] = {};
    }
    var cell = column && column[ty];
    if (autoCreate && !cell) {
      cell = column[ty] = {};
    }
    var tile = cell && cell[z];
    if (autoCreate && !tile) {
      tile = cell[z] = Object.create(Tile);
      tile.initialize(tileSize);
    }
    return tile;
  }

  // Get an object from a given x,y in the world
  function get(x, y, z) {
    x = parseInt(x, 10);
    y = parseInt(y, 10);
    z = parseInt(z, 10);
    var tile = getTile(x, y, z);
    x = x % tileSize;
    if (x < 0) x += tileSize;
    y = y % tileSize;
    if (y < 0) y += tileSize;
    return tile ? items[tile.get(x, y)] : items[0];
  }

  // Set an object to a given x,y in the world
  function set(x, y, z, obj) {

    var tile = getTile(x, y, z, true);
    var index = items.indexOf(obj);
    if (index < 0) {
      index = items.push(obj) - 1;
      if (index > 255) {
        throw new Error("Cannot save more then 256 unique objects in this database");
      }
    }
    x = x % tileSize;
    if (x < 0) x += tileSize;
    y = y % tileSize;
    if (y < 0) y += tileSize;
    var old = tile.get(x, y);
    if (old != index) {
      tile.set(x, y, index);
      if (!shutdown) {
        dirty = true;
        checkSave();
      }
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
        var cell = column[y];
        var indexCell = indexColumn[y] = {};
        Object.keys(cell).forEach(function (z) {
          var item = cell[z];
          var clone = new Buffer(item.buffer.length);
          item.buffer.copy(clone);
          buffers.push(clone);
          indexCell[z] = position;
          position += clone.length;
        });
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
    if (!dirty) process.exit();
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