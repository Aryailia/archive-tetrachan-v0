
var TetraChanPopup;

(function (textReader, utils) {
  'use strict';

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
   * Factory function for the popup handler
   * 
   * @param {HTMLDom}
   */
  TetraChanPopup = function (body, template, listeningContexts, options) {
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
    var settings = utils.shallowDefaultOverride({
      onCaretChange: utils.nullFunction,
      throttle: 500,
    }, options);

    // Return
    var method = Object.create(null);

    method.setOptions = utils.shallowDefaultOverride.bind(null, settings);

    method.show = function () {
      _.body.appendChild(_.container);
    };
      
    method.hide = function () {
      _.body.removeChild(_.container);
      my.clear();

    };
      
    method.push = function (template, rank) {
      //_.container.appendChild(template);
      _.container.innerHTML += template;

    };

    method.clear = function () {
      while (_.container.lastChild) {
        _.container.removeChild(_.container.lastChild);
      }
    };
    
    // Cause good habits, need to come back later and see what i actually need to delete
    method.clean = function () {
      // Remove event listeners
      _.listeners.forEach(function (obj) {
        obj.removeEventListener('mousemove', method.throttledMove);
      });

      // Clean up methods?
      Object.getOwnPropertyNames(method).forEach(function (prop) {
        delete(method[prop]);
      });
      
      // Clean up private variables, probably don't actually need to do this
      Object.getOwnPropertyNames(_).forEach(function (prop) {
        delete(_[prop]);
      });

    };

    method.move = function (newText) {
      var caratChange = newText !== _.text;
      _.text = newText;

      if (caratChange) {
        settings.onCaretChange(newText);
      }
    };
    
    var time = Date.now();
    var cooldown = 0;
    var timeoutID;
    method.throttledMove = function (ev) {
      var deltaTime = Date.now() - time;
      time += deltaTime;
      var check = cooldown - deltaTime;

      // Things to run on every event even on throttle cooldown
      var text = textReader.extract(ev, 0); // rangeParent and rangeOffset are affected
      //console.log(text);
      
      if (check < (- options.throttle)) {
        cooldown = 0;
        method.move(text);
      } else if (check <= 0) { // Falling edge
        cooldown = options.throttle;
        timeoutID = setTimeout(method.move, options.throttle + check, text);
      } else { // We're on cooldown
        cooldown -= deltaTime;
      }
    };

    // Add event listeners
    _.listeners.forEach(function (obj) {
      obj.addEventListener('mousemove', method.throttledMove);
    });

    return method;
  };

  function _need(arg, errorText) {
    if (typeof arg === 'undefined') {
      throw new Error(errorText);
    }
    return arg;
  }
  


}(TetraChanText, TetraChanUtils));