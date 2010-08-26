console.dir(process.env);
console.dir(require.paths);
require('./test');
require('./app').listen(parseInt(process.env.PORT));
