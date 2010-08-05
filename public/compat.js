// Add object.keys for Safari
if (!Object.keys) {
  Object.keys = function objectKeys(obj) {
    var keys = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        keys.push(key);
      }
    }
    return keys;
  };
}

// Fast version for browsers with Object.keys
function forEach(obj, callback, thisObject) {
  var keys = Object.keys(obj);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    callback.call(thisObject, obj[key], key, obj);
  }
}
