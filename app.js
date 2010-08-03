
var Connect = require('connect'),
    io = require('./lib/socket.io'),
    worldDB = require('./world-db');

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

  function watch(x,y,value) {
    if (x >= X && x < X + W && y >= Y && y < Y + H) {
      console.log("Sending to client");
      var message = {};
      message[x] = {};
      message[x][y] = value;
      client.send(JSON.stringify(message));
    }
  }
  emitter.on("change", watch);

  client.on('message', function (json) {
    console.log("Message received");
    try {
      var message = JSON.parse(json);
    } catch (err) {
      console.error(err.stack);
      return;
    }
    if (message.v) {
      world.set(message.x, message.y, message.v);
      emitter.emit('change', message.x, message.y, message.v);
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
            var value = world.get(x, y);
            if (value) {
              count++;
              setMap(x, y, value);
              (updates[x] || (updates[x] = {}))[y] = parseInt(value, 10);
            }
          }
        }
      }

      if (count) {
        client.send(JSON.stringify(updates));
        console.log("Send %d updates to client", count);
      }
    }
  });
  client.on('disconnect', function () {
    emitter.removeListener('change', watch);
  });
});


