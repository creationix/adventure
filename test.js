var world = require('./world-db')(),
    fs = require('fs');
    
// Stress test creating lots of data.
for (var z = 0; z < 10; z++) {
  (function () {
    var item = {num: z};
    var x = 512,
        y = 512;
    for (var i = 0; i < 200000; i++) {
      x += Math.floor(Math.random() * 7 - 3);
      y += Math.floor(Math.random() * 7 - 3);
      world.set(x, y, item);
    }
  }());
}

function saveSync() {
  var before = new Date;
  var snapshot = world.snapshot();
  console.log("Snapshot took " + (new Date - before) + "ms");

  // Save the metadata
  fs.writeFile('world.meta', snapshot.meta);

  // Safe the buffers
  var fd = fs.openSync('world.grids', 'w', 0666);
  snapshot.buffers.forEach(function (buffer) {
    fs.writeSync(fd, buffer);
  });
  fs.close(fd);
  
}

saveSync();


