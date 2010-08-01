var WIDTH = 13,
    HEIGHT = 12,
    TILE_WIDTH = 100,
    TILE_HEIGHT = 82,
    current = 0,
    map;

function loadMap() {
  map = new Array(WIDTH);
  for (var x = 0; x < WIDTH; x++) {
    var column = map[x] = new Array(HEIGHT);
    for (var y = 0; y < HEIGHT; y++) {
      set(x, y, 0);
    }
  }
  var req = new XMLHttpRequest();
  req.open('GET', '/range/0/0/' + WIDTH + '/' + HEIGHT, true);
  req.onreadystatechange = function (e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        var response = JSON.parse(req.responseText);
        response.forEach(function (column, x) {
          column.forEach(function (index, y) {
            set(x, y, index || 0);
          });
        });
        setTimeout(longPoll, 100);
      } else {
        setTimeout(loadMap, 1000);
        console.error("Error loading page\n");
      }
    }
  };

  req.send(null);

}

function longPoll() {
  console.log("Start longPoll");
  var req = new XMLHttpRequest();
  req.open('GET', '/watch/0/0/' + WIDTH + '/' + HEIGHT, true);
  req.onreadystatechange = function (e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        var response = JSON.parse(req.responseText);
        console.log(response);
        set(response.x, response.y, response.v);
        longPoll();
      } else {
        setTimeout(longPoll, 500);
        console.error("Error loading page\n");
      }
    }
  };

  req.send(null);
}

function get(id) {
  return document.getElementById(id);
}

window.onload = function () {
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

  var mapDiv = get("map");
  var paletteDiv = get("palette");
  var mainDiv = get("main");

  mapDiv.innerHTML = html.join("\n");
  html = [];
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

  loadMap();

};

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
    save(parts[0], parts[1], current);
  }
}

function save(x, y, value) {
  var req = new XMLHttpRequest();
  req.open('POST', '/set/' + x + '/' + y + '/' + value, true);
  req.send(null);
  // set(x, y, value);
}

function set(x, y, value) {

  map[x][y] = value;
  var div = document.getElementById('background_' + x + "x" + y);
  div.className = "tile " + imageClasses[map[x][y]];
}

