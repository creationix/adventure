
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
  // new client is here!
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
      var missing = message.m;
      var bulk = {};
      var count = 0;
      Object.keys(message.m).forEach(function (x) {
        var column = bulk[x] = {};
        message.m[x].forEach(function (y) {
          column[y] = world.get(x, y);
          count++;
        });
      });
      if (count) {
        client.send(JSON.stringify(bulk));
        console.log("Send %d updates to client", count);
      }
    }
  });
  client.on('disconnect', function () {
    emitter.removeListener('change', watch);
  });
});


