/**
 * This started out as a project to make a smaller size functional library
 * like Lodash and Lazy but to be much smaller in size while still being
 * expandable into functional reactive programming with streams and async
 * input.
 * 
 * Although I started with a similar approach to how Lodash 4 approached Lazy
 * evaluation, I now use thunks or sort-of function promises to do lazy
 * evluation, which turns out to be, from understanding, the same approach
 * Lazy.js takes, though my inspiration was from Haskell. When using Lazy.js
 * I found I could not operate on streams the way I wanted, though to be fair,
 * I'm not very savvy with the library.
 * 
 * Concepts:
 * I'll be avoiding explanation functional programming and the benefits of lazy
 * evaluation.
 * 
 * Invoking the Compose function wraps the input in a Compose-object (aka.
 * returns a monad) that one can chain all the functional commands of off.
 * Naive functions are also defined as methods off the Compose function
 * itself (since functions themselves are objects).
 * 
 * eg. Compose([1,2]).map(x => x * 2) // Chaining, preferred
 *     Compose.map([1,2], x => x * 2) // Naive, no wrapping involved
 * 
 * When methods are chained, with a few exceptions, what actually happens is
 * a function is pushed on to the functor stack (callstack). This is because
 * execution is default lazy and will not execute unless it is necessary. To
 * force evaluation use .seq() or .eval(), (note: two of the said exceptions).
 * Excluding these methods that deal with evaluation, all methods are
 * chainable. Both are marked in documentation.
 * 
 * If a method has an interator or predicate function as an argument (eg.
 * map, filter, reduce) then they will be passed:
 * - for chaining (2 parameters): entry, index  
 * - for naive    (3 parameters): entry, index, array
 * following the same pattern as vanilla Javascript map/etc. functions.
 * The {array} portion is omitted for chaining because when evaluated lazily,
 * it specifically avoids finding the whole array to cut execution time.
 * 
 * To achieve lazy evaluation, this library employs the concept of thunks.
 * Each consecutive chained method gets passed a function object for the
 * previous method in the chain, ie. in Compose([]).map().filter(), filter
 * is passed a function that will execute map, and map is passed a function
 * that will retrieve an element at a set position from the wrapping. This
 * way, execution can be delayed and only the things needed to be computed
 * are computed.
 * 
 * Code is not reused between chainable and naive versions unfortuantely.
 * As mentioned before, calling a chainable method pushes it onto the stack.
 * Once on the stack, calling .seq() function will essentially do a do-while
 * loop until the call (aka. functor/thunk) stack returns false for
 * termination. This means that chainable methods actually push stepwise
 * functions onto the call stack. These stepwise functions pass data to each
 * other via a pointer, which is achieved via an array (note: while this also
 * allows multiple values to be passed, there should only ever be one value
 * pass via the pointer). Additionally these stepwise functions must return
 * true if it can continue or false if it cannot.
 * 
 * Another important feature is that it can operate over more than just arrays.
 * In fact any object can be operated over so long as you provide an
 * appropriate parameteers to:
 * Compose(objToWrap, options = { getter: , setter: , factory: })
 * The format these functions must take is given above the definition for
 * Compose.
 * 
 * To extract the result from the Compose wrapping (monad), please use .value()
 * Another feature worth mention is that a Compose-objects implement the
 * iterator API and will execute any built up chainable methods on the call
 * stack when using a for...of construction.
 * 
 * @todo getting working with non-array objects
 * @todo mark if chainable or not
 */

/**
 * @namespace {object} Compose
 * @typedef {*} custom
 * @typedef {function(*,number,Array):Compose} iteratee
 * @typedef {function(*,number,Array):boolean} predicate
 * @typedef {function(custom,*,number)} setter
 * @typedef {function(custom,number):custom} getter
 * @typedef {function():custom} new
 */
(function () {
  'use strict';

  //var MAX_SAFE_INTEGER = 9007199254740991;
  var INFINITY = 1 / 0;
  var IS_ES6_YET = typeof Symbol === 'function' && typeof Symbol() === 'symbol';

  function _default(options, property, defaultOption) {
    return typeof options == 'object' && options.hasOwnProperty(property)
      ?options[property]
      :defaultOption;
  }

  function _newArray(size) {
    return new Array(size == undefined ? 0: size);
  }

  function _arrayGetter(result, index, array) {
    var length = array.length;
    if (index < length && (-index - 1) < length) {
      result.push(array[((index % length) + length) % length]);
      return true;
    } else {
      //result.push(undefined); // Implicity does this already
      return false;
    }
  }

  /**
   * MyClass.prototype gets the Observable API
   * @mixes ComposeMixin
   * @returns {Compose}
   */
  function Compose(obj, options) {
    // Insert check for already wrapped?
    var wrapping = Object.create(ComposeDelegate);
    wrapping.__wrapped__ = obj;
    wrapping.__getter__ = _default(options, 'getter', _arrayGetter);
    wrapping.__setter__ = _default(options, 'setter', _concatPush);
    wrapping.__new__ = _default(options, 'newObj', _newArray);
    wrapping.__functor__ = wrapping.__getter__;
    if (IS_ES6_YET) {
      wrapping.__index__ = -1;
      wrapping[Symbol.iterator] = function () { return wrapping; };
    }
    /*Object.keys(ComposeDelegate).forEach(function (key) {
      wrapping[key] = ComposeDelegate[key];
    });*/
    return wrapping;
  }

  /**
   * @mixin
   **/
  var ComposeDelegate = {};

  /**
   * This essentially fmaps {functor}
   * @param {*} wrapping The 
   * @param {*} parameter The iteratee/predicate/argument to pass
   * @param {*} functor The logic to be push
   * @returns {Object} The state created for any extra params
   */
  function _chainTo(wrapping, parameter, functor) {
    var state = Object.create(null);
    state.thunk = wrapping.__functor__;
    state.index = 0;
    wrapping.__functor__ = function (pointer, index, obj) {
      return functor(parameter, pointer, index, obj, state);
    };
    return state;
  }

  function _inStepSeq(thunk, target, parent) {
    var index = -1;
    while (thunk(target, ++index, parent));
  }

  /**
   * @param {Object} obj
   * @param {...Object} [mixins] Objects to asorb the properties from
   * @returns {Object}
   */
  Compose.shallowAssign = function (obj, mixins) {
    var mixin, properties, j;
    var i = 0; // Skip <obj> but get all others
    var getSymbols = Object.getOwnPropertySymbols || false; // Only in ECMA6
    while (++i < arguments.length) { // All mixins after <obj> in arguments
      mixin = arguments[i]; // ECMA5 array access
      properties = Object.getOwnPropertyNames(mixin)
        .concat(getSymbols ? getSymbols(mixin) : []);
      
      // Copy properties over
      j = -1;
      while (++j < properties.length) {
        Object.defineProperty(obj, properties[j],
          Object.getOwnPropertyDescriptor(mixin, properties[j]));
      }
    }
    return obj;
  };
  /*
  Compose.default = function (defaultOptions, options) {
    var settings = Object.create(null);
    Object.keys(defaultOptions).forEach(function (key) {
      settings[key] = options.hasOwnProperty(key)
        ? options[key]
        : defaultOptions[key];
    });
  };*/

  /**
   * Creates a array of numbers from {start} up to but not including {end}
   * {step} is the distance between consecutive elements, which can be negative
   * 
   * You can specify one to three arguments
   * 1) one argument (X) is interpreted as 0 to X as the end with spacing of 1
   * 2) two (x, Y) is interpreted as X to Y with a spacing of 1
   * 3) three (X, Y, Z) is interpreted as X to Y with a spacing of Z
   * 
   * @param {number} start
   * @param {number} end
   * @param {number} step Can be either positive or negative
   * @returns {Array<number>} Non-exclusive of end
   */
  Compose.range = function (start, end, step) {
    switch (arguments.length) {
      case 1: end = start; start = 0;
      case 2: step = 1;
      case 3: break;
      case 0: default: throw new SyntaxError('Expected 1-3 arguments.');
    }
    var index = -1;
    var len = Math.max(Math.ceil((end - start) / step), 0); // Excludes {end}
    var output = new Array(len);
    while (len--) {
      output[++index] = start;
      start += step;
    }
    return output;
  };



  /**
   * The next function that works with the es6 iterator interface
   * Use it as:
   * for (let entry of $([1,2]).map(x => x * 2)) {
   *   // Stuff to perform
   * }
   * 
   * At the moment Compose.seq does not use this
   * Not sure if this will always be the case yet
   * @memberof Compose
   * @returns {Compose}
   */
  ComposeDelegate.next = function next() {
    var pointer = [];
    if (this.__functor__(pointer, ++this.__index__, this.__wrapped__)) {
      return { value: pointer };
    } else { // Reset and return done
      this.__functor__ = this.__getter__;
      this.__index__ = -1;
      return { done: true };
    }
  };

  /**
   * Forces evaluation (since it's lazy evaluation)
   * Specifically, it evaluates the functor stack and then resets it
   * May want to consider using .next() in  
   * 
   * @memberof Compose
   * @returns {Compose}
   */
  ComposeDelegate.seq = function seq() {
    var functor = this.__functor__;
    var result = [];
    var index = -1;
    var pointer; // Using pointer as functor can return more than one value
    while (functor(pointer = [], ++index, this.__wrapped__)) {
      _concatPush(result, pointer);
    }
    this.__wrapped__ = result;
    this.__functor__ = this.__getter__;
    return this;
  };

  /**
   * Unwraps the Compose object
   * @memberof Compose
   * @returns {*} Unwrapped object
   */
  ComposeDelegate.value = function value() {
    return this.seq().__wrapped__;
  };

  /**
   * @memberof Compose
   * @category Lazy
   * @category Random Access
   * @param {iteratee} iteratee
   * @param {Array} over
   * @returns {Compose}
   */
  Compose.map = function (iteratee, over) {
    var i = -1;
    var len = over.length;
    var output = new Array(len);
    while (++i < len) {
      output[i] = iteratee(over[i], i, over);
    }
    return output;
  };
  ComposeDelegate.map = function (iteratee) {
    if (typeof iteratee !== 'function') {
      throw new SyntaxError('map: expects a function');
    }
    _chainTo(this, iteratee, _mapStep);
    return this;
  };
  function _mapStep(iteratee, pointer, pos, parent, past) {
    if (past.thunk(pointer, pos, parent)) { // request another execution if yet evaluated
      pointer[0] = iteratee(pointer[0], pos);
      return true; // Never terminate
    } else {
      return false;
    }
  }

  /**
   * 
   * @memberof Compose
   * @category Lazy
   * @category Sequential
   * @param {predicate} predicate
   * @param {Array} over
   * @returns {Array}
   */
  Compose.filter = function (predicate, over) {
    var i = -1;
    var outputIndex = -1;
    var len = over.length;
    var output = [];
    while (++i < len) {
      if (predicate(over[i], i, over)) {
        output[++outputIndex] = over[i];
      }
    }
    return output;
  };
  ComposeDelegate.filter = function (predicate) {
    if (typeof predicate !== 'function') {
      throw new SyntaxError('filter expects a function');
    }
    _chainTo(this, predicate, _filterStep);
    return this;
  };
  // Finds the first element from index
  function _filterStep(predicate, pointer, pos, parent, past) {
    var dir = pos < 0 ? -1 : 1;
    var sentinel;

    // For negative direction, have to correct index to first index being -1
    if (past.index == 0 && pos < 0) { past.index -= 1; }
    do { // Loop until thunk returns a valid
      if (past.thunk(pointer, past.index, parent)) {
        sentinel = predicate(pointer[0], past.index);
        if (!sentinel) { pointer.pop(); } // Skip if fail {predicate}
      } else {
        return false;
      }
      past.index += dir;
    } while (!sentinel);
    return true;
  }

  /**
   * Conceptually empty arrays are synonymous with non-existance and will be deleted
   * @todo do while loop until pos finds target
   * @todo work with reverse
   * @category Lazy
   * @category Sequential
   */
  Compose.flatten = function () {

  };
  ComposeDelegate.flatten = function (depth) {
    if (typeof depth !== 'number') {
      throw new SyntaxError('flatten expects a number');
    }
    var state = _chainTo(this, depth, _flattenStep);
    state.memoized = [];
    return this;
  };
  ComposeDelegate.flattenDeep = function () {
    var state = _chainTo(this, INFINITY, _flattenStep);
    state.memoized = [];
    return this;
  };
  // Memoizes full flattened entry if necessary, then handles doing the getting
  // Perhaps consider modulus solution to {normalizedIndex}
  // Probably have to do a do while loop to work with randomized
  function _flattenStep(depth, pointer, pos, parent, past) {
    var fromRight = pos < 0;
    var flattened = past.memoized;
    var normalizedIndex = fromRight ? -pos - 1 : pos;

    // Populate {past.memoized}
    if (normalizedIndex >= flattened.length) { // Already calculated?
      // Poll the next thunk to populate the memoized array
      // {fromRight} direction first index is -1 but opposite is 0
      // so have to asymetrically increment
      if (past.thunk(pointer, fromRight ? --past.index : past.index++, parent)) {
        //console.log('a',pointer, past.index, fromRight);
        _flattenDepth(pointer.pop(), depth, fromRight, flattened);
      } else { // No more thunks to evaluate
        return false;
      }
    }
    pointer[0] = flattened[normalizedIndex];
    return true;
  }
  function _flattenDepth(over, level, fromRight, result) {
    var length = over.length;
    var index = fromRight ? length : -1;
    if (level > 0 && _isArray(over)) {
      if (level > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        while (fromRight ? index-- : ++index < length) {
          _flattenDepth(over[index], level - 1, fromRight, result);
        }
      } else {
        _concatPush(result, over, fromRight);
      }
    } else {
      result.push(over);
    }
    return result;
  }
  function _isArray(testee) {
    return typeof testee.length !== 'undefined';
  }


  /**
   * @memberof Compose
   * @category Not Lazy
   * @category Sequential
   * @param {Array} over
   * @param {function} iteratee
   * @param {*} intial
   */
  Compose.reduce = function (iteratee, initial, over) {
    var i = -1;
    var len = over.length;
    var accumulator = initial;
    while (++i < len) {
      accumulator = iteratee(accumulator, over[i], i, over);
    }
    return accumulator;
  };
  ComposeDelegate.reduce = function (parameter, initial) {
    if (typeof parameter !== 'function' && typeof parameter !== 'number') {
      throw new SyntaxError('chunk expects a function or a number');
    }
    var state = _chainTo(this, parameter, _reduceStep);
    state.accumulator = initial;

    return this;
  };
  function _reduceStep(iteratee, pointer, pos, parent, past) {
    var index = -1;
    if (past.index++ === 0) {
      //console.log
      while (past.thunk(pointer, ++index, parent)) {
        past.accumulator = iteratee(past.accumulator, pointer.pop(), index);
      }
      pointer[0] = past.accumulator;
      return true;
    } else {
      return false;
    }
  }

  /**
   * In proceeding
   * Non-lazy in the reverse direction
   * 
   * @memberof Compose
   * @category Lazy
   * @category Not Lazy
   * @category Sequential
   * @param {number|Function} parameter 
   * @todo definitely must check if works with general data types
   * @todo make random access?
   * might need to implement length
   */
  Compose.chunk = function (parameter, over) {
    
  };
  ComposeDelegate.chunk = function (parameter) {
    var type = typeof parameter;
    if (type !== 'function' && type !== 'number') {
      throw new SyntaxError('chunk expects a function or a number');
    }
    _chainTo(this, type === 'number'
      ? function (elem, index) { return (index + 1) % parameter === 0; }
      : parameter,
    _chunkStep);
    return this;
  };
  function _chunkStep(predicate, pointer, pos, parent, past) {
    if (pos >= 0) {
      return _chunkLeft(predicate, pointer, pos, parent, past);        
    } else { // _chunkRight memoizes
      return _chunkRight(predicate, pointer, pos, parent, past);
    }
  }
  function _chunkLeft(predicate, pointer, pos, parent, past) {
    var entry;
    var chunk = [];
    while (past.thunk(pointer, past.index, parent)) {
      entry = pointer.pop();
      chunk.push(entry); // Note: increment in next step
      if (predicate(entry, past.index++)) { break; } // Terminating condition
    }
    if (chunk.length > 0) { pointer[0] = chunk; }
    return chunk.length > 0;
  }
  // No way to be lazy (without memozing whole list) without length function
  function _chunkRight(predicate, pointer, pos, parent, past) {
    if (past.index === 0) { // _chunkLeft will increment so it only runs once
      past.memoized = []; // Only need memoization for _chunkRight case
      while (_chunkLeft(predicate, pointer, 0, parent, past)) { // 0 dead value
        past.memoized.push(pointer.pop());
      }
    }
    return _arrayGetter(pointer, pos, past.memoized);
  }

  /**
   * @category Chains
   * @category Lazy
   * @category Random Access
   * @param {Function} iteratee
   */
  Compose.foreach = function () {

  };
  ComposeDelegate.foreach = function (iteratee) {
    if (typeof iteratee !== 'function') {
      throw new SyntaxError('map: expects a function');
    }
    _chainTo(this, iteratee, _foreachStep);
    return this;
  };
  function _foreachStep(iteratee, pointer, pos, parent, past) {
    if (past.thunk(pointer, pos, parent)) { // request another execution if yet evaluated
      iteratee(pointer[0], pos);
      return true; // Never terminate
    } else {
      return false;
    }
  }

  /**
   * @memberof Compose
   * @category Random Access
   * @category Lazy
   */
  Compose.reverse = function (over) {
    var maxIndex = over.length - 1;
    return Compose.map(function (entry, index) {
      return over[maxIndex - index];
    }, over);
  };
  ComposeDelegate.reverse = function () {
    _chainTo(this, 0, _reverseStep); // parameter is a throwaway
    return this;
  };
  function _reverseStep(p, pointer, pos, parent, past) {
    return past.thunk(pointer, -pos - 1, parent);
  }

  /**
   *
   * @memberof Compose
   * @category Not Lazy
   * @category Sequential
   * @param {Function(Object, Object):boolean} compare 
   */
  ComposeDelegate.sort = function (compare, searchType) {
    if (typeof compare !== 'function' || typeof searchType !== 'string') {
      throw new SyntaxError('sort: expects a function and a string');
    }
    var state = _chainTo(this, compare, _sortStep);
    switch (searchType) { // Set state.search
      case 'unstable':     state.search = _unstableSort; break;
      case 'stableMerge':  state.search = _stableMergeSort; break;
      case 'stableInsert': state.search = _stableInsertSort; break;
      default: throw new SyntaxError('sort: invalid {searchType}');
    }
    state.memoized = [];

    return this;
  };
  function _sortStep(compare, pointer, pos, parent, past) {
    if (past.index++ === 0) {
      _inStepSeq(past.thunk, past.memoized, parent);
      past.search(past.memoized, compare);
      console.log(past.memoized);
    }
    return _arrayGetter(pointer, pos, past.memoized);
  }
  function _unstableSort(array, compare) {
    return array.sort(compare);
  }

  function _stableMergeSort(array, compare) {
    var size = 1;
    while (size < array.length) {
      var left = 0;
      // Fork
      while (left + size < array.length) {
        _mergeStep(array, left, size, compare);
        left += size * 2;
      }
      size *= 2;
      // Join
    }
  }
  function _mergeStep(array, left, size, compare) {
    var i = left - 1;
    var right = left + size;
    var lastIndex = Math.min(right + size - 1, array.length - 1);
    var leftIndex = left;
    var rightIndex = right;
    var temp = new Array(lastIndex + 1);

    while (++i <= lastIndex) {
      if (compare([leftIndex], array[rightIndex]) > 0 ||
          rightIndex > lastIndex && leftIndex < right) {
        temp[i] = array[leftIndex];
        ++leftIndex;
      } else {
        temp[i] = array[rightIndex];
        ++rightIndex;
      }
    }

    i = left - 1;
    while (++i <= lastIndex) {
      array[i] = temp[i];
    }
  }

  function _stableInsertSort(array, compare) {
    var i = 0; // Start on second index
    var length = array.length;
    var j, temp;
    while (++i < length) {
      j = i;
      while (compare(array[j - 1], array[j]) > 0) {
        temp = array[j - 1];
        array[j - 1] = array[j];
        array[j] = temp;
        --j;
      }
    }
  }

  /**
   * Still need to make this apply generally to different data types for over
   * 
   * @memberof Compose
   * @category Lazy
   * @param {*} over
   * @param {number} count
   * @returns {Compose}
   */
  ComposeDelegate.take = function (count) {
    if (typeof count !== 'number') {
      throw new SyntaxError('take: expects a number');
    }
    _chainTo(this, count, _takeStep);
    return this;
  };
  function _takeStep(count, pointer, pos, parent, past) {
    return ++past.index <= count && past.thunk(pointer, pos, parent);
  }

  /**
   * @memberof Compose
   * @category Lazy
   * @category Random Access
   * @param {Array<Object>...} zipList
   */
  Compose.zip = function () {

  };
  ComposeDelegate.zip = function () {
    var t = this.__getter__;
    _chainTo(this, Compose.map(function (entry) { // Copy arguments into an array
      return Compose(entry, { getter: t }); // and wrap with Compose for getter
    }, arguments), _zipStep);
    return this;
  };
  // Loop until all {zipList} getters returns false
  function _zipStep(zipList, pointer, pos, parent, past) {
    var i = -1;
    var temp = [];
    var sentinel = past.thunk(pointer, pos, parent); // First check

    temp.push(pointer.pop()); // will push undefined if empty
    while (++i < zipList.length) {
      sentinel = zipList[i].__getter__(pointer, pos, zipList[i].__wrapped__)
        || sentinel; // Rest of the checks
      temp.push(pointer.pop()); // will push undefined if empty
    }

    if (sentinel) { // If zipList still has some elements to be mined then mine
      pointer[0] = temp;
      return true;
    } else {
      return false;
    }
  }


  /**
   * Appends the elements of `target` to `base`.
   *
   * @private
   * @param {Array} base The array to modify.
   * @param {Array} target The array to append.
   * @param {Number} count Max length of resulting array
   * @returns {Array} The new concatenated array
   */
  function _concatPush(base, target, fromRight) {
    var offset = base.length;
    var maxIndex = target.length - 1;
    var index = -1;
    
    while (++index <= maxIndex) {
      base[index + offset] = target[fromRight ? maxIndex - index : index];
    }
    return base;
  }

  /** Iunno how exactly this works but taken from Lodash */

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = typeof global == 'object' && global && global.Object === Object && global;
  /** Detect free variable `self`. */
  var freeSelf = typeof self == 'object' && self && self.Object === Object && self;
  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();
  /** Detect free variable `exports`. */
  var freeExports = typeof exports == 'object' && exports && !exports.nodeType && exports;
  /** Detect free variable `module`. */
  var freeModule = freeExports && typeof module == 'object' && module && !module.nodeType && module;

  if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
    // Expose Lodash on the global object to prevent errors when Lodash is
    // loaded by a script tag in the presence of an AMD loader.
    // See http://requirejs.org/docs/errors.html#mismatch for more details.
    // Use `_.noConflict` to remove Lodash from the global object.
    root.Compose = Compose;
    root.$ = Compose;
  } else if (freeModule) {
    freeModule.exports = Compose;
  } else {
    root.Compose = Compose;
    root.$ = Compose;
  }
}.call(this));