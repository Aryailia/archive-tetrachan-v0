var utils = {
  settingsOver: function (possibilities, settings) {
    var toAdd = settings == undefined ? {} : settings;
    var obj = Object.create(null);
    Object.keys(possibilities).forEach(function (key) {
      var base = toAdd.hasOwnProperty(key)
        ? toAdd[key]
        : possibilities[key];

      obj[key] = typeof base === 'object'
        ? Object.assign(base.constructor(), toAdd[key]) // One-level deep clone
        : base; // Or just straight copy
      delete toAdd[key];
    });

    if (Object.keys(toAdd).length > 0) { // If any properties left over
      throw new Error('{settings} passed with invalid arguments' + toAdd);
    }
    return obj;
  },
};

module.exports = utils;