
var imageClassesInv = {};
forEach(imageClasses, function (name, i) {
  imageClassesInv[name] = parseInt(i, 10);
});

var X = 0,
    Y = 0,
    socket,
    TILE_WIDTH = 99,
    TILE_HEIGHT = 82,
    BUFFER = 4,
    WIDTH,
    HEIGHT,
    tileDivs = {},
    current = 0;
    map = {};

function setMap(x, y, z, value) {
  var column = map[x];
  if (!column) { column = map[x] = {}; }
  var cell = column[y];
  if (!cell) { cell = column[y] = {}; }
  cell[z] = value;
}

function getMap(x, y, z) {
  return (map[x] && map[x][y] && map[x][y][z]);
}

function trimMap() {
  var x2 = X + WIDTH + BUFFER;
  var y2 = Y + HEIGHT + BUFFER;
  // Trim old columns
  Object.keys(map).forEach(function (ix) {
    if (ix < X - BUFFER || ix >= x2) {
      delete map[ix];
      return;
    }
    // Trim old rows
    var column = map[ix];
    Object.keys(column).forEach(function (iy) {
      if (iy < Y - BUFFER || iy >= y2) {
        delete column[iy];
      }
    });
  });
}

var ignoreHash = false;
onhashchange = function () {
  if (ignoreHash) { return; }
  var hash = window.location.hash.replace(/^#/, '');
  var parts = hash.split("/");
  X = parseInt(parts[0], 10);
  Y = parseInt(parts[1], 10);
  if (X != X || Y != Y) {
    if (X != X) X = 0;
    if (Y != Y) Y = 0;
    ignoreHash = true;
    window.location.hash = hash = "#" + X + "/" + Y;
    setTimeout(function () {
      ignoreHash = false;
    });
  }
  var tx = X * TILE_WIDTH;
  var ty = Y * TILE_HEIGHT;
  if (wx < tx - TILE_WIDTH || wx > tx + TILE_WIDTH) {
    moveTo(tx, wy);
  }
  if (wy < ty - TILE_HEIGHT || wy > ty + TILE_HEIGHT) {
    moveTo(wx, ty);
  }
  // moveTo(tx, ty);
};



function makeDiv(x, y) {
  var div = document.createElement('div');
  div.style.top = y + "px";
  div.style.left = x + "px";
  return div;
}


var TWIDTH, THEIGHT;
function generateTiles() {
  if (TWIDTH == WIDTH && THEIGHT == HEIGHT) return;
  TWIDTH = WIDTH;
  THEIGHT = HEIGHT;

  mapDiv.innerHTML = "";
  tileDivs = {};
  for (var y = 0; y < HEIGHT; y++) {
    for (var x = 0; x < WIDTH; x++) {
      if (!tileDivs[x]) { tileDivs[x] = {}; }
      var column = tileDivs[x][y] = [
        makeDiv(x * TILE_WIDTH, y * TILE_HEIGHT),
        makeDiv(x * TILE_WIDTH, y * TILE_HEIGHT - 41),
        makeDiv(x * TILE_WIDTH, y * TILE_HEIGHT - 82),
        makeDiv(x * TILE_WIDTH, y * TILE_HEIGHT - 123)
      ];
      column.forEach(function (div) {
        mapDiv.appendChild(div);
      });
    }
  }
  for (y = 0; y < HEIGHT; y++) {
    for (x = 0; x < WIDTH; x++) {
      var div = makeDiv(x * TILE_WIDTH, y * TILE_HEIGHT - 41);
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
    html.push('<div id="' + imageClasses[i] + '" style="top: ' + (i * 120 + 20) + 'px; left: 20px" class="tileHandle"></div>');
  });
  paletteDiv.innerHTML = html.join("\n");
}

var SX, SY, SWIDTH, SHEIGHT;

function loadMap() {
  WIDTH = Math.floor(window.innerWidth / TILE_WIDTH + 0.5);
  HEIGHT = Math.floor(window.innerHeight / TILE_HEIGHT + 3.5);

  scrollMap();

  if (SX == X && SY == Y && SWIDTH == WIDTH && SHEIGHT == HEIGHT) return;
  SX = X; SY = Y; SWIDTH = WIDTH; SHEIGHT = HEIGHT;

  generateTiles();

  var x2 = X + WIDTH, y2 = Y + HEIGHT;
  for (var x = X; x < x2; x++) {
    for (var y = Y; y < y2; y++) {
      for (var z = 0; z < 4; z++) {
        update(x, y, z);
      }
    }
  }

  trimMap();
  socket.send(JSON.stringify({
    x: X - BUFFER,
    y: Y - BUFFER,
    w: WIDTH + BUFFER * 2,
    h: HEIGHT + BUFFER * 2
  }));

}



function scrollMap() {
  var ox = wx % TILE_WIDTH;
  if (ox < 0) ox += TILE_WIDTH;
  var oy = wy % TILE_HEIGHT;
  if (oy < 0) oy += TILE_HEIGHT;
  oy += TILE_HEIGHT / 2;
  mapDiv.style.webkitTransform = "translate3d(" + -ox + "px," + -oy + "px,0)";
  // mapFrame.scrollLeft = ox;
  // mapFrame.scrollTop = oy;
}


function get(id) {
  return document.getElementById(id);
}

var mapDiv, paletteDiv, mainDiv, mapFrame;

window.onload = function () {
  setTimeout(onLoad);
};

function drag(element, dragfn, clickfn) {
  var dragX, dragY, click, timeout;

  function start(e) {
    dragX = e.pageX;
    dragY = e.pageY;
    click = e;
    e.stopPropagation();
    e.preventDefault();
  }
  function move(e) {
    if (!(dragX && dragY)) return;
    click = false;
    dragfn(dragX - e.pageX, dragY - e.pageY);
    dragX = e.pageX;
    dragY = e.pageY;
    e.stopPropagation();
    e.preventDefault();
  }
  function end(e) {
    if (click && clickfn) {
      clickfn(click);
    }
    dragX = null;
    dragY = null;
    e.stopPropagation();
    e.preventDefault();
  }

  element.addEventListener('mousedown', start, false);
  element.addEventListener('mousemove', move, false);
  element.addEventListener('mouseup', end, false);
  element.addEventListener('touchstart', function (e) {
    if (e.touches.length == 1) {
      var touch = e.touches[0];
      touch.stopPropagation = function () { e.stopPropagation(); };
      touch.preventDefault = function () { e.preventDefault(); };
      start(touch);
    }
  }, false);
  element.addEventListener('touchmove', function (e) {
    if (e.touches.length == 1) {
      var touch = e.touches[0];
      touch.stopPropagation = function () { e.stopPropagation(); };
      touch.preventDefault = function () { e.preventDefault(); };
      move(touch);
    }
  }, false);
  element.addEventListener('touchend', end, false);
}

function onLoad() {

  mapDiv = get("map");
  mapFrame = get("mapFrame");
  paletteDiv = get("palette");
  mainDiv = get("main");

  generatePalette();

  document.addEventListener('keydown', onKeydown, true);
  document.addEventListener('keyup', onKeyup, true);
  window.addEventListener('resize', onResize, true);
  drag(mapDiv, function onDrag(dx, dy) {
    moveTo(wx + dx, wy + dy);
  }, onClick);
  drag(paletteDiv, function onDrag(dx, dy) {
    paletteFrame.scrollTop += dy;
  }, onClick);

  if (typeof PalmSystem === "undefined") {
    socket = new io.Socket(null);
  } else {
    socket = new io.Socket("10.0.1.6");
    PalmSystem.stageReady();
    PalmSystem.enableFullScreenMode(true);
  }
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

function onResize(evt) {

  loadMap();

}

function onMessage(message) {
  try {
    message = JSON.parse(message);
  } catch (e) {
    console.error(message);
    return;
  }
  forEach(message, function (column, x) {
    x = parseInt(x, 10);
    forEach(column, function (values, y) {
      y = parseInt(y, 10);
      forEach(values, function (value, z) {
        z = parseInt(z, 10);
        setMap(x, y, z, value);
        update(x, y, z);
      });
    });
  });
}

var up = false,
    left = false,
    right = false,
    down = false;

var wx = 0, wy = 0, last = new Date;

function moveTo(x, y) {
  if (x==wx && y == wy) return;
  wx = x;
  wy = y;

  X = Math.floor(wx / TILE_WIDTH);
  Y = Math.floor(wy / TILE_HEIGHT);

  ignoreHash = true;
  window.location.hash = "#" + X + "/" + Y;
  setTimeout(function () {
    ignoreHash = false;
  });


  loadMap();

}

setInterval(function () {
  var now = new Date;
  var distance = Math.floor((now - last));
  last = now;
  var my = (up ? -1 : 0) + (down ? 1 : 0);
  var mx = (left ? -1 : 0) + (right ? 1 : 0);
  if (!(mx || my)) return;
  moveTo(wx + mx * distance, wy + my * distance);
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
    e.preventDefault();

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
    e.preventDefault();
  }
}

function onClick(e) {
  if (e.target.className.substr("tileHandle") < 0) return;
  var id = e.target.id;
  if (id && e.target.className.indexOf('tileHandle') >= 0) {
    current = id;
    var divs = document.getElementsByClassName("tileActive");
    for (var i = 0, l = divs.length; i < l; i++) {
      divs[i].className = "tileHandle";
    }
    e.target.className += " tileActive";
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  if (e.target.x !== undefined && current) {
    var z = (e.shiftKey ? 2 : 0) + (e.altKey ? 0 : 1);
    save(e.target.x + X, e.target.y + Y, z, current);
    if (z < 4 && current.indexOf('-tall') > 0) {
      save(e.target.x + X, e.target.y + Y, z + 1, null);
    }
    e.stopPropagation();
    e.preventDefault();
  }
}

function save(x, y, z, value) {
  socket.send(JSON.stringify({x:x,y:y,z:z,v:imageClassesInv[value]}));
}


function update(x, y, z) {
  var column = tileDivs[x - X];
  if (!column) { return; }
  var tiles = column[y - Y];
  if (!tiles) { return; }
  var tile = tiles[z];
  var value = getMap(x, y, z);
  tile.className = "tile " + imageClasses[(getMap(x, y, z))];
}

