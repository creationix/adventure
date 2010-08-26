var fs = require('fs');
fs.writeFile("/home/node/test.log", JSON.stringify(process.env));
