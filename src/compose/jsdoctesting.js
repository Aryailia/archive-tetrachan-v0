'use strict';

/**
 * @typedef Point
 */
var Point = {
  asdf: function (a) {},
};
Point.bcdef = function (a) {
};


/**
 * I do stuff and things
 * @typedef {Function(Object, number)} Compose
 * @param {Object} obj Yoyo this a test
 * @param {number} blank The blue cat
 */
function TypeDefTest(obj, number) {
  var wrapping = Object.create(null);
  wrapping.__wrapped__ = obj;
  return wrapping;
}

/**
 * @returns {Point}
 */
function ReturnObjectTest() {
}
ReturnObjectTest().a;

/**
 * @callback addedCallback
 * @param {number} result
 */

/**
 * hello
 * @param {number} num1
 * @param {number} num2
 * @param {addedCallback} callback
 */
var add = function (num1, num2, callback) {
};

add(1,1,'');


/**
 * @returns {Compose}
 */
function test() {
}


module.exports = {v: TypeDefTest};