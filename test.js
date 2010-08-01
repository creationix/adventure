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

// Persist the data
world.save(function (err) {
  if (err) throw err;
  console.dir(arguments);
});


