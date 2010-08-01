var X = 0,
    Y = 0,
    socket,
    TILE_WIDTH = 99,
    TILE_HEIGHT = 82,
    WIDTH,
    HEIGHT,
    current = 0;

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
  wx = X * TILE_WIDTH;
  wy = Y * TILE_HEIGHT;

  loadMap(true);
}


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
  }
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
  var html = [];
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      html.push('<div id="background_' + x + "x" + y + '" style="top: ' + (y * TILE_HEIGHT) + 'px; left: ' + x * TILE_WIDTH + 'px"></div>');
    }
  }
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      html.push('<div class="tileHandle" id="' + x + "x" + y + '" style="top: ' + (y * TILE_HEIGHT) + 'px; left: ' + x * TILE_WIDTH + 'px"></div>');
    }
  }

  mapDiv.innerHTML = html.join("\n");
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

function loadMap(newData) {
  oldWIDTH = WIDTH;
  oldHEIGHT = HEIGHT;
  WIDTH = Math.floor(document.width / TILE_WIDTH) + 2;
  HEIGHT = Math.floor(document.height / TILE_HEIGHT) + 3;

  if (oldWIDTH != WIDTH || oldHEIGHT != HEIGHT) {
    generateTiles();
  }

  if (newData) {
    socket.send(JSON.stringify({x:X,y:Y,w:WIDTH,h:HEIGHT}));
  } else {
    scrollMap();
  }

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
    loadMap(true);
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
    console.log(message);
    return;
  }
  scrollMap();
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
  var distance = Math.floor((now - last));
  last = now;
  var my = (up ? -1 : 0) + (down ? 1 : 0);
  var mx = (left ? -1 : 0) + (right ? 1 : 0);
  if (!(mx || my)) return;
  wx += mx * distance;
  wy += my * distance;
  var OX = X, OY = Y;
  X = Math.floor(wx / TILE_WIDTH);
  Y = Math.floor(wy / TILE_HEIGHT);

  ignoreHash = true;
  window.location.hash = "#" + X + "/" + Y;
  setTimeout(function () {
    ignoreHash = false;
  });


  loadMap(OX != X || OY != Y);
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
  if (id.indexOf('x') > 0) {
    var parts = id.split("x");
    save(parseInt(parts[0], 10) + X, parseInt(parts[1], 10) + Y, current);
  }
}

function save(x, y, value) {
  x = parseInt(x, 10);
  y = parseInt(y, 10);
  socket.send(JSON.stringify({x:x,y:y,v:value}));
}

function set(x, y, value) {
  x = parseInt(x, 10);
  y = parseInt(y, 10);
  var id = 'background_' + (x - X) + "x" + (y - Y);
  var div = get(id);
  if (div) {
    div.className = "tile " + imageClasses[value];
  }
}

