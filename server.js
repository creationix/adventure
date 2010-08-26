console.dir(process.env);
console.dir(require.paths);
require('./app').listen(parseInt(process.env.PORT));
