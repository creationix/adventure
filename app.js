var Connect = require('connect');

// HTTP Logic
module.exports = Connect.createServer(
  Connect.logger(),
  Connect.bodyDecoder(),
  Connect.router(function (app) {}),
  Connect.staticProvider(__dirname + "/public")
);
