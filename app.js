var Connect = require('connect'),
    worldDB = require('./world-db');

var world = worldDB('world.db', 1024, 10000);
var listeners = [];

// HTTP Logic
module.exports = Connect.createServer(
  Connect.logger(),
  Connect.bodyDecoder(),
  Connect.router(function (app) {

    app.post("/set/:x/:y/:value", function (req, res, next) {
      var x = parseInt(req.params.x, 10);
      var y = parseInt(req.params.y, 10);
      var value = parseInt(req.params.value, 10);
      world.set(x, y, value);
      listeners = listeners.filter(function (listener) {
        return listener(x, y, value);
      });
      res.writeHead(204, {});
      res.end();
    });

    app.get("/range/:x/:y/:w/:h", function (req, res, next) {
      var x = parseInt(req.params.x, 10);
      var y = parseInt(req.params.y, 10);
      var w = parseInt(req.params.w, 10);
      var h = parseInt(req.params.h, 10);
      var result = new Array(w);
      for (var i = 0; i < w; i++) {
        var column = result[i] = new Array(h);
        for (var j = 0; j < h; j++) {
          column[j] = world.get(x + i, y + j);
        }
      }
      res.simpleBody(200, result);
    });

    app.get("/watch/:x/:y/:w/:h", function (req, res, next) {
      var x1 = parseInt(req.params.x, 10);
      var y1 = parseInt(req.params.y, 10);
      var w = parseInt(req.params.w, 10);
      var h = parseInt(req.params.h, 10);
      var x2 = x1 + w;
      var y2 = y1 + h;

      listeners.push(function (x, y, value) {
        if (!(x >= x1 && x < x2 && y >= y1 && y < y2)) return true;
        res.simpleBody(200, { x: x, y: y, v: value });
      });
    });

  }),
  Connect.staticProvider(__dirname + "/public")
);
