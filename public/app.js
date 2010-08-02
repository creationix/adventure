var X = 0,
    Y = 0,
    socket,
    TILE_WIDTH = 99,
    TILE_HEIGHT = 82,
    WIDTH,
    HEIGHT,
    tiles = {},
    current = 0,
    map = {};

function setMap(x, y, value) {
  (map[x] || (map[x] = {}))[y] = value;
}

function getMap(x, y) {
  return (map[x] && map[x][y]);
}

function trimMap(x, y, w, h) {
  var x2 = x + w;
  var y2 = y + h;
  // Trim old columns
  Object.keys(map).forEach(function (ix) {
    if (ix < x || ix >= x2) {
      delete map[ix];
      return;
    }
    // Trim old rows
    var column = map[ix];
    Object.keys(column).forEach(function (iy) {
      if (iy < y || iy >= y2) {
        delete column[iy];
      }
    });
  });
}

var ignoreHash = false;
onhashchange = function () {
  if (ignoreHash) { return; }
  var hash = window.location.hash.replace(/^#/, '');
  if (!hash) {
    window.location.hash = "#" + X + "/" + Y;
  }
  var parts = hash.split("/");
  X = parseInt(parts[0], 10);
  Y = parseInt(parts[1], 10);
  var tx = X * TILE_WIDTH;
  var ty = Y * TILE_HEIGHT;
  if (wx < tx - TILE_WIDTH || wx > tx + TILE_WIDTH) {
    wx = tx;
  }
  if (wy < ty - TILE_HEIGHT || wy > ty + TILE_HEIGHT) {
    wy = ty;
  }
  loadMap();
};


// Implement Object.keys for browsers that don't have it
if (!Object.keys) {
  Object.keys = function (obj) {
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };
}

// forEach for objects, very handy
Object.forEach = function forEach(obj, callback, thisObject) {
  var keys = Object.keys(obj);
  var length = keys.length;
  for (var i = 0; i < length; i++) {
    var key = keys[i];
    callback.call(thisObject, obj[key], key, obj);
  }
};


function generateTiles() {
  mapDiv.innerHTML = "";
  tiles = {};
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      var div = (tiles[x] || (tiles[x] = {}))[y] = document.createElement('div');
      div.style.top =  (y * TILE_HEIGHT) + "px";
      div.style.left =  (x * TILE_WIDTH) + "px";
      mapDiv.appendChild(div);
    }
  }
  for (y = 0; y < HEIGHT; y++) {
    for (x = 0; x < WIDTH; x++) {
      var div = document.createElement('div');
      div.style.top =  (y * TILE_HEIGHT) + "px";
      div.style.left =  (x * TILE_WIDTH) + "px";
      div.className = "tileHandle";
      div.x = x;
      div.y = y;
      mapDiv.appendChild(div);
    }
  }
}

function generatePalette() {
  var html = [];
  imageClasses.forEach(function (name, i) {
    html.push('<div style="top: ' + (i * 120 + 20) + 'px; left: 20px" class="tile ' + name + '"></div>');
  });
  imageClasses.forEach(function (name, i) {
    var className = (i == 0) ? "tileHandle tileActive" : "tileHandle";
    html.push('<div id="item-' + i + '" style="top: ' + (i * 120 + 20) + 'px; left: 20px" class="' + className + '"></div>');
  });
  paletteDiv.innerHTML = html.join("\n");
}

function loadMap() {
  oldWIDTH = WIDTH;
  oldHEIGHT = HEIGHT;
  WIDTH = Math.floor(document.width / TILE_WIDTH) + 2;
  HEIGHT = Math.floor(document.height / TILE_HEIGHT) + 3;

  if (oldWIDTH != WIDTH || oldHEIGHT != HEIGHT) {
    generateTiles();
  }

  trimMap(X, Y, WIDTH, HEIGHT);
  var missing = {};
  scrollMap();
  for (var x = X, x2 = X + WIDTH; x < x2; x++) {
    for (var y = Y, y2 = Y + WIDTH; y < y2; y++) {
      var value = getMap(x, y);
      set(x, y, value);
      if (value === undefined) {
        (missing[x] || (missing[x] = [])).push(y);
      }
    }
  }
  socket.send(JSON.stringify({
    x: X,
    y: Y,
    w: WIDTH,
    h: HEIGHT,
    m: missing
  }));

}

function scrollMap() {
  var ox = wx % TILE_WIDTH;
  if (ox < 0) ox += TILE_WIDTH;
  var oy = wy % TILE_HEIGHT;
  if (oy < 0) oy += TILE_HEIGHT;

  mapFrame.scrollLeft = ox + TILE_WIDTH;
  mapFrame.scrollTop = oy + TILE_HEIGHT;
}


function get(id) {
  return document.getElementById(id);
}

var mapDiv, paletteDiv, mainDiv, mapFrame;

window.onload = function () {

  mapDiv = get("map");
  mapFrame = get("mapFrame");
  paletteDiv = get("palette");
  mainDiv = get("main");

  generatePalette();

  mainDiv.addEventListener('click', onClick);
  mainDiv.addEventListener('keydown', onKeydown, true);
  mainDiv.addEventListener('keyup', onKeyup, true);

  socket = new io.Socket(null);
  socket.connect();
  socket.on('message', onMessage);
  socket.on('connect', function () {
    onhashchange();
    loadMap();
  });
  socket.on('disconnect', function () {
    console.log("Reconnecting");
    socket.connect();
  });

};

function onMessage(message) {
  try {
    message = JSON.parse(message);
  } catch (e) {
    console.error(message);
    return;
  }
  Object.forEach(message, function (column, x) {
    x = parseInt(x, 10);
    Object.forEach(column, function (value, y) {
      y = parseInt(y, 10);
      set(x, y, value);
    });
  });
}

var up = false,
    left = false,
    right = false,
    down = false;

var wx = 0, wy = 0, last = new Date;

setInterval(function () {
  var now = new Date;
  var distance = Math.floor((now - last) / 2);
  last = now;
  var my = (up ? -1 : 0) + (down ? 1 : 0);
  var mx = (left ? -1 : 0) + (right ? 1 : 0);
  if (!(mx || my)) return;
  wx += mx * distance;
  wy += my * distance;
  X = Math.floor(wx / TILE_WIDTH);
  Y = Math.floor(wy / TILE_HEIGHT);

  ignoreHash = true;
  window.location.hash = "#" + X + "/" + Y;
  setTimeout(function () {
    ignoreHash = false;
  });


  loadMap();
}, 10);


function onKeydown(e) {
  var suppress = true;
  switch (e.keyCode) {
    case 37: left = true; break;
    case 38: up = true; break;
    case 39: right = true; break;
    case 40: down = true; break;
    default: suppress = false; break;
  }
  if (suppress) {
    e.stopPropagation();
  }
}

function onKeyup(e) {
  var suppress = true;
  switch (e.keyCode) {
    case 37: left = false; break;
    case 38: up = false; break;
    case 39: right = false; break;
    case 40: down = false; break;
    default: suppress = false; break;
  }
  if (suppress) {
    e.stopPropagation();
  }
}

function onClick(e) {
  if (e.target.className.substr("tileHandle") < 0) return;
  var id = e.target.id;

  if (id.indexOf('item-') === 0) {
    current = id.substr(id.indexOf('-') + 1);
    document.getElementsByClassName("tileActive")[0].className = "tileHandle";
    e.target.className += " tileActive";
    return;
  }
  if (e.target.x !== undefined) {
    save(e.target.x + X, e.target.y + Y, current);
  }
}

function save(x, y, value) {
  x = parseInt(x, 10);
  y = parseInt(y, 10);
  socket.send(JSON.stringify({x:x,y:y,v:value}));
}


function set(x, y, value) {
  var column = tiles[x - X];
  if (!column) return;
  var tile = column[y - Y];
  if (!tile) return;
  tile.className = "tile " + imageClasses[value];
  setMap(x, y, value);
}

