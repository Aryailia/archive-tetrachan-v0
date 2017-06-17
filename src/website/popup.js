
var Utils = require('../browser/utils.js');
var textReader = require('./textinput.js');

function _makeContainer() {
// Create the div for the popup
  var container = document.createElement('div');
  var style = container.style;
  style.width = '400px';
  style.height = '100px';
  style.position = 'fixed';
  style.left = '0px';
  style.top  = '0px';
  //style.visibility = 'visible';
  style.zIndex = '400';//*/
  style.backgroundColor = '#00FFF0';
  return container;
}

/**
 * @param {HTMLElement} body
 * @param {Object} template
 * @param {Array<HTMLElement>} listeningContexts All the objects to which
 * to attach event handlers
 * @param {Object} options
 * @param {Function} options.onCaretChange
 * @param {number} options.throttle
 */
function TetraPopup(body, template, listeningContexts, options) {
  // Private variables
  var _ = {
    body: body,
    container: _makeContainer(),
    text: '',
    listeners: listeningContexts,
    mouse: undefined,
//      throttle: 100,
  };

  // 
  var settings = Utils.shallowDefaultOverride({
    onCaretChange: Utils.nullFunction,
    throttle: 500,
  }, options);
  
    // Return
  var popup = Object.create(null);

  popup.setOptions = Utils.shallowDefaultOverride.bind(null, settings);

  popup.show = function () {
    _.body.appendChild(_.container);
  };
    
  popup.hide = function () {
    _.body.removeChild(_.container);
    popup.clear();
  };
    
  popup.push = function (template, rank) {
    //_.container.appendChild(template);
    _.container.innerHTML += template;
    console.log(rank);

  };

  popup.clear = function () {
    while (_.container.lastChild) {
      _.container.removeChild(_.container.lastChild);
    }
  };
  
  // Cause good habits, need to come back later and see what i actually need to delete
  popup.clean = function () {
    // Remove event listeners
    _.listeners.forEach(function (obj) {
      obj.removeEventListener('mousemove', popup.throttledMove);
    });

    // Clean up objs?
    Object.getOwnPropertyNames(popup).forEach(function (prop) {
      delete(popup[prop]);
    });
    
    // Clean up private variables, probably don't actually need to do this
    Object.getOwnPropertyNames(_).forEach(function (prop) {
      delete(_[prop]);
    });

  };

  popup.move = function (newText) {
    var caratChange = newText !== _.text;
    _.text = newText;

    if (caratChange) {
      settings.onCaretChange(newText);
    }
  };
  
  var time = Date.now();
  var cooldown = 0;
  var timeoutID;
  
  popup.throttledMove = function (ev) {
    var deltaTime = Date.now() - time;
    time += deltaTime;
    var check = cooldown - deltaTime;

    // Things to run on every event even on throttle cooldown
    var text = textReader.extract(ev, 0); // rangeParent and rangeOffset are affected
    //console.log(text);
    
    if (check < (- options.throttle)) {
      cooldown = 0;
      popup.move(text);
    } else if (check <= 0) { // Falling edge
      cooldown = options.throttle;
      timeoutID = setTimeout(popup.move, options.throttle + check, text);
    } else { // We're on cooldown
      cooldown -= deltaTime;
    }
  };

  // Add event listeners
  _.listeners.forEach(function (obj) {
    obj.addEventListener('mousemove', popup.throttledMove);
  });

  return popup;
}

/*function _need(arg, errorText) {
  if (typeof arg === 'undefined') {
    throw new Error(errorText);
  }
  return arg;
}*/

module.exports = TetraPopup;