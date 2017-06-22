var $ = require('../../lib/Compose/compose.js');
var htmlparser = require('htmlparser2');

var commands = {
  /**
   * Handles boilerplate, runs it through the default dom handler
   * 
   * @param {string} str String of html code to be parsed
   * @returns {Object} Parsed dom
   */
  parse: function (str) {
    var output;
    var parsed = new htmlparser.Parser(
      new htmlparser.DomHandler(function (error, dom) {
        if (error) {
          throw new Error('Error: htmlparser - ' + error);
          //output = undefined;
        } else {
          output = dom;
        }
      })//,
      //{ decodeEntities: true }
    );//.parseComplete(str); // Seems to be old or something
    parsed.write(str);
    parsed.end();
    return output;
  },

  htmlTag: function (tagName) {
    return function (node) {
      return node.name === tagName;
    };
  },

  byId: function (id) {
    return function (node) {
      return node.hasOwnProperty('attribs') && node.attribs.id === id;
    };
  },

  cssClass: function _cssClass(className) {
    return function (node) {
      return node.hasOwnProperty('attribs') && node.attribs.class === className;
    };
  },


  /**
   * Deeply recurses through the DOM tree to find all elements that matches
   * the selector
   * Includes the parent node, ie. everything {dom} itself as well as children
   * 
   * Note: The . selector currently only tells it to access class attribute,
   * doesn't actually test for multiple classes
   * 
   * @param {string} selector Selector to search for
   * @param {Array<object>} dom DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  find: function (selector, dom) {
    var result = [];
    if (selector.startsWith('#')) {
      _find(result, dom, commands.byId(selector.substr(1)));
    } else if (selector.startsWith('.')) {
      _find(result, dom, commands.cssClass(selector.substr(1)));
    } else {
      _find(result, dom, commands.htmlTag(selector));
    }
    return result;
  },

  /**
   * Can traverse DOM tree structure as deep as necessary. Loops through the
   * {selectorList} and does find per selector. Successive finds are on the
   * children of the results of previous finds.
   * Parent nodes are included in search
   * 
   * Note: The . selector currently only tells it to access class attribute,
   * doesn't actually test for multiple classes
   * 
   * @param {Array<string>} selectorList Selectors to loop through
   * @param {Array<object>} dom DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  query: function (selectorList, dom) {
    var $dom = $(dom);
    selectorList.forEach(function (selector) {
      $dom.filter(_hasChildren).map(function (entry) {
        return commands.find(selector, [entry]);
      }).flatten(1);
    });
    return $dom.value();
  },

  /**
   * Traverses in single steps to test if subnodes match the selectors in order
   * Parent nodes are not included in the search
   * 
   * Note: The . selector currently only tells it to access class attribute,
   * doesn't actually test for multiple classes
   * 
   * @param {Array<string>} selectorList Selectors to loop through
   * @param {Array<object>} dom DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  stepQuery: function (selectorList, dom) {
    var $dom = $(dom);
    selectorList.forEach(function (selector) {
      $dom.filter(_hasChildren).map(_toChildren).flatten(1);
      if (selector.startsWith('#')) {
        $dom.filter(commands.byId(selector.substr(1)));
      } else if (selector.startsWith('.')) {
        $dom.filter(commands.cssClass(selector.substr(1)));
      } else {
        $dom.filter(commands.htmlTag(selector));
      }
    });
    return $dom.value();
  },
};

function _hasChildren(node) {
  return node.hasOwnProperty('children');
}

function _toChildren(node) {
  return node.children;
}

/**
 * Recursively search for all nodes in the {dom} tree inclusive of itself that
 * test true against {predicate}
 * 
 * @param {Array} result Matching nodes are pushed into this
 * @param {Array<object>} dom The dom to match and who's children to match
 * @param {function(object):boolean} predicate Test an entry on some condition
 */
function _find(result, dom, predicate) {
  var entry;
  var index = -1;
  var length = dom.length;
  while (++index < length) {
    entry = dom[index];
    if (predicate(entry)) {
      result.push(entry);
    }
    if (entry.hasOwnProperty('children')) {
      _find(result, entry.children, predicate);
    }
  }
}

module.exports = commands;