'use strict';

var Utils = {
  fetch: window.fetch,

  shallowDefaultOverride: function (defaults) {
    var key, desc, j;
    var settings = Object.create(null);
    var getSymbols = Object.getOwnPropertySymbols || false; // Only in ECMA6
    var properties = Object.getOwnPropertyNames(defaults)
        .concat(getSymbols ? getSymbols(defaults) : []);
    var i = properties.length;
    

    while (i--) {
      key = properties[i];
      Object.defineProperty(settings, key, Object.getOwnPropertyDescriptor(defaults, key));

      // Override the default with any settings specified in {arguments}
      j = 0; // Skip <obj> but get all others
      while (++j < arguments.length) {
        desc = Object.getOwnPropertyDescriptor(arguments[j], key);
        if (desc != 'undefined')
          Object.defineProperty(settings, key, desc);
      }
    }
    return settings;
  },

  nullFunction: function () {},
  responseText: function (data) { return data.text(); },
  responseJSON: function (data) { return data.json(); },

  printArgs: function () {
    var args = Array.prototype.slice.call(arguments);
    for (var i = 0; i < args.length; ++i) {
      console.log(args[i]);
    }
  },

};

module.exports = Utils;