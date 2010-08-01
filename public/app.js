var WIDTH = 20,
    HEIGHT = 20,
    TILE_WIDTH = 100,
    TILE_HEIGHT = 82,
    map;

function loadMap() {
  map = new Array(WIDTH);
  for (var x = 0; x < HEIGHT; x++) {
    var column = map[x] = new Array(HEIGHT);
    for (var y = 0; y < HEIGHT; y++) {
      set(x, y, 0);
    }
  }
}



window.onload = function () {
  var html = [];
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      html.push('<div id="' + x + "x" + y + '" style="top: ' + (y * TILE_HEIGHT) + 'px; left: ' + x * TILE_WIDTH + 'px"></div>');
    }
  }
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      html.push('<div class="tileHandle" id="handle_' + x + "x" + y + '" style="top: ' + (y * TILE_HEIGHT) + 'px; left: ' + x * TILE_WIDTH + 'px"></div>');
    }
  }
  
  document.getElementById("map").innerHTML = html.join("\n");
  // html = [];
  // for (var i in imageClasses) {
  //   var name = imageClasses[i];
  //   html.push('<div style="top: ' + ((i - 1) * 170 + 20) + 'px; left: 20px" class="tile ' + name + '" id="item-' + i + '"><div class="tile"></div></div>');
  // }
  // document.getElementById("palette").innerHTML = html.join("\n");
  loadMap();
  
  setInterval(function () {
    set(Math.floor(Math.random() * WIDTH), Math.floor(Math.random() * HEIGHT), Math.floor(Math.random() * imageClasses.length));
  }, 0);
};

function set(x, y, value) {
  map[x][y] = value;
  var div = document.getElementById(x + "x" + y);
  div.className = "tile " + imageClasses[map[x][y]];
}

