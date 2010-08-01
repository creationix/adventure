var world = require('./world-db')(),
    Step = require('step'),
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

var save = Step.fn(function () {
  var before = new Date;
  var snapshot = world.snapshot();
  console.log("Snapshot took " + (new Date - before) + "ms");

  // Save the metadata
  fs.writeFile('world.meta', snapshot.meta, this.parallel());

  // Safe the buffers
  var stream = fs.createWriteStream('world.grids');
  snapshot.buffers.forEach(function (buffer) {
    stream.write(buffer);
  });
  stream.end();
  stream.addListener('close', this.parallel());
});

save(function (err, one, two) {
  console.dir(arguments);
});


