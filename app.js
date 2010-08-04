
var Connect = require('connect'),
    io = require('./lib/socket.io'),
    worldDB = require('./world-db'),
    imageClasses = require('./public/tiles'),
    imageClassesInv = {};

Object.keys(imageClasses).forEach(function (i) {
  imageClassesInv[imageClasses[i]] = parseInt(i, 10);
})

var world = worldDB('world.db', 1024, 10000);
var emitter = new process.EventEmitter();

// HTTP Logic
module.exports = Connect.createServer(
  Connect.logger({format: ':method :url :status HTTP:http-version :remote-addr (:response-time ms)'}),
  Connect.conditionalGet(),
  Connect.cache(),
  Connect.gzip(),
  Connect.staticProvider(__dirname + "/public")
);

var socket = io.listen(module.exports);

socket.on('connection', function (client) {
  // Lets us "know" what data the client wants
  var map = {};

  function setMap(x, y, value) {
    (map[x] || (map[x] = {}))[y] = value;
  }

  function getMap(x, y) {
    return (map[x] && map[x][y]);
  }

  function trimMap() {
    var x2 = X + W;
    var y2 = Y + H;
    // Trim old columns
    Object.keys(map).forEach(function (ix) {
      if (ix < X || ix >= x2) {
        delete map[ix];
        return;
      }
      // Trim old rows
      var column = map[ix];
      Object.keys(column).forEach(function (iy) {
        if (iy < Y || iy >= y2) {
          delete column[iy];
        }
      });
    });
  }

  var X = 0, Y = 0, W = 0, H = 0;

  function watch(x,y,z,value) {
    if (x >= X && x < X + W && y >= Y && y < Y + H) {
      console.log("Sending to client");
      var message = {};
      message[x] = {};
      message[x][y] = {};
      message[x][y][z] = imageClassesInv[value];
      client.send(JSON.stringify(message));
    }
  }
  emitter.on("change", watch);

  client.on('message', function (json) {
    try {
      var message = JSON.parse(json);
    } catch (err) {
      console.error(err.stack);
      return;
    }
    if (message.v !== undefined) {
      var value = imageClasses[message.v];
      world.set(message.x, message.y, message.z, value);
      emitter.emit('change', message.x, message.y, message.z, value);
      return;
    }
    if (message.w && message.h) {
      X = message.x;
      Y = message.y;
      W = message.w;
      H = message.h;

      trimMap();
      var updates = {};
      var count = 0;
      var x2 = X + W, y2 = Y + H;
      for (var x = X; x < x2; x++) {
        for (var y = Y; y < y2; y++) {
          if (getMap(x, y) === undefined) {
            var cell = (updates[x] || (updates[x] = {}))[y] = [];
            setMap(x, y, true);
            for (var z = 0; z < 4; z++) {
              var value = imageClassesInv[world.get(x, y, z)];
              if (value > 0) {
                count++;
                cell[z] = parseInt(value, 10);
              }
            }
          }
        }
      }

      if (count) {
        client.send(JSON.stringify(updates));
        console.log("Send %d updates to client %s:%s", count, client.request.socket.remoteAddress, client.request.socket.remotePort);
      }
    }
  });
  client.on('disconnect', function () {
    emitter.removeListener('change', watch);
  });
});


