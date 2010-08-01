var X = 0,
    Y = 0,
    socket,
    TILE_WIDTH = 100,
    TILE_HEIGHT = 82,
    WIDTH,
    HEIGHT,
    current = 0;

onhashchange = loadMap;
  


function loadMap() {
  var hash = window.location.hash.replace(/^#/, '');
  if (!hash) {
    window.location.hash = "#" + X + "/" + Y;
  }
  var parts = hash.split("/");
  X = parseInt(parts[0], 10);
  Y = parseInt(parts[1], 10);
  WIDTH = parseInt(parts[2], 10) || Math.floor(document.width / TILE_WIDTH) + 1;
  HEIGHT = parseInt(parts[3], 10) || Math.floor(document.height / TILE_HEIGHT) + 1;
  
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
  
  socket.send(JSON.stringify({x:X,y:Y,w:WIDTH,h:HEIGHT}));

}


function get(id) {
  return document.getElementById(id);
}

var mapDiv, paletteDiv, mainDiv;

window.onload = function () {
  
  mapDiv = get("map");
  paletteDiv = get("palette");
  mainDiv = get("main");
  
  var html = [];
  for (var i in imageClasses) {
    var name = imageClasses[i];
    html.push('<div style="top: ' + (i * 120 + 20) + 'px; left: 20px" class="tile ' + name + '"></div>');
  }
  for (var i in imageClasses) {
    var name = imageClasses[i];
    var className = (i == 0) ? "tileHandle tileActive" : "tileHandle";
    html.push('<div id="item-' + i + '" style="top: ' + (i * 120 + 20) + 'px; left: 20px" class="' + className + '"></div>');
  }
  paletteDiv.innerHTML = html.join("\n");

  mainDiv.addEventListener('click', onClick);
  mainDiv.addEventListener('keypress', onKeypress);

  socket = new io.Socket('localhost');
  socket.connect();
  socket.on('message', onMessage);
  socket.on('connect', loadMap);

};

function onMessage(message) {
  try {
    message = JSON.parse(message);
  } catch (e) {
    console.log(message);
    return;
  }
  set(message.x, message.y, message.v);
}

// Pan with the wasd keys
function onKeypress(e) {
  switch(e.charCode) {
    case 119: // w
      window.location.hash = "#" + X + "/" + (Y - 1);
      break;
    case 97:  // a
      window.location.hash = "#" + (X - 1) + "/" + Y;
      break;
    case 115: // s
      window.location.hash = "#" + X + "/" + (Y + 1);
      break;
    case 100: // d
      window.location.hash = "#" + (X + 1) + "/" + Y;
      break;
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

