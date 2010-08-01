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

var save = Step.fn(
  function writeNewFile() {
    // Get a consistent snapshot of the entire db
    var snapshot = world.snapshot();

    // Save the metadata
    fs.writeFile('world.meta.tmp', snapshot.meta, this.parallel());

    // Safe the buffers
    var stream = fs.createWriteStream('world.grids.tmp');
    stream.addListener('close', this.parallel());
    snapshot.buffers.forEach(function (buffer) {
      stream.write(buffer);
    });
    stream.end();

  },
  function unlinkOldFiles(err) {
    if (err) throw err;
    fs.unlink('world.grids', this.parallel());
    fs.unlink('world.meta', this.parallel());
  },
  function moveFilesIn(err) {
    fs.rename('world.grids.tmp', 'worlds.grids', this.parallel());
    fs.rename('world.meta.tmp', 'meta.grids', this.parallel());
  }
);

save(function (err, one, two) {
  if (err) throw err;
  console.dir(arguments);
});


