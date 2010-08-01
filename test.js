var world = require('./world-db')(1024),
    Step = require('step'),
    fs = require('fs');
    
// Stress test creating lots of data.
for (var z = 0; z < 5; z++) {
  (function () {
    var item = {num: z};
    var x = 512,
        y = 512;
    for (var i = 0; i < 2000000; i++) {
      x += Math.floor(Math.random() * 5 - 2);
      y += Math.floor(Math.random() * 5 - 2);
      world.set(x, y, item);
    }
  }());
}

// Persist the data
world.save(function (err) {
  if (err) throw err;
  console.dir(arguments);
});


