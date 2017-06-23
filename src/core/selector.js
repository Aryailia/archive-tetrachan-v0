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
    return commands.attrib('class', className);
  },

  prop: function _cssClass(property, value) {
    return function (node) {
      return node[property] === value;
    };
  },

  attrib: function _cssClass(attribute, value) {
    return function (node) {
      return node.hasOwnProperty('attribs') && node.attribs[attribute] === value;
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
   * @param {function(object):boolean} predicate Selector to search for
   * @param {Array<object>} nodeList DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  find: function (predicate, nodeList) {
    var result = [];
    _find(result, predicate, nodeList);
    return result;
  },

  /**
   * Can traverse DOM tree structure as deep as necessary. Loops through the
   * {selectorList} and does find per selector. Successive finds are on the
   * children of the results of previous finds.
   * 
   * Note: The . selector currently only tells it to access class attribute,
   * doesn't actually test for multiple classes
   * 
   * @param {Array<string>} selectorList Selectors to loop through
   * @param {Array<object>} nodeList DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  query: function (selectorList, nodeList) {
    var $dom = $(nodeList);
    selectorList.forEach(function (selector) {
      $dom.filter(_hasChildren).map(function (entry) {
        var temp;
        //switch (selector.substr(0,1)) {
        if (selector.startsWith('#')) {
          commands.find(nodeList, commands.byId(selector.substr(1)));
        } else if (selector.startsWith('.')) {
          commands.find(nodeList, commands.cssClass(selector.substr(1)));
        } else if (selector.startsWith('[')) {
          temp = selector.match(/^\[([^=]+)=([^=]+)\]$/);
          if (temp == null) {
            throw new SyntaxError('query: the selector \'' + selector + '\' is malformed');
          }
          commands.find(nodeList, commands.attrib(temp[1], temp[2]));
        } else if (selector.startsWith('{')) {
          temp = selector.match(/^\{([^=]+)=([^=]+)\}$/);
          if (temp == null) {
            throw new SyntaxError('query: the selector \'' + selector + '\' is malformed');
          }
          commands.find(nodeList, commands.prop(temp[1], temp[2]));
        } else {
          commands.find(nodeList, commands.htmlTag(selector));
        }
        return commands.find(selector, [entry]);
      }).flatten(1);
    });
    return $dom.value();
  },

  /**
   * Traverses in single steps to test if subnodes match the selectors in order
   * If specify '*' string as a selector, it just goes to the children
   * 
   * Note: The . selector currently only tells it to access class attribute,
   * doesn't actually test for multiple classes
   * 
   * @param {Array<string>} selectorList Selectors to loop through
   * @param {Array<object>} nodeList DOM Tree to iterate over
   * @returns {Array<object>} List of nodes
   */
  stepQuery: function (selectorList, nodeList) {
    var $dom = $(nodeList);
    selectorList.forEach(function (selector, index) {
      if (index > 0) { // Go to children on the join boundaries
        $dom.filter(_hasChildren).map(_toChildren).flatten(1);
      }
      // Perform appropriate selector
      if (selector.startsWith('#')) {
        $dom.filter(commands.byId(selector.substr(1)));
      } else if (selector.startsWith('.')) {
        $dom.filter(commands.cssClass(selector.substr(1)));
      } else if (selector !== '*') {
        $dom.filter(commands.htmlTag(selector));
      }
    });
    return $dom.value();
  },

  getText: function (nodeList) {
    var text = [];
    _getText(text, nodeList);
    return text.join('');
  },

  /**
   * @param {Array<string>} ignoreList Properties to ignore
   * @param {Array<object>} nodeList List of dom nodes to print
   * @returns {void}
   */
  print: function (ignoreList, nodeList) {
    var ignore = {};
    ignoreList.forEach(key => ignore[key] = true);

    nodeList.forEach(function (dom) {
      var test = {};
      Object.keys(dom).forEach(function (key) {
        if (!ignore[key]) {
          test[key] = dom[key];
        }
      });
      console.log(test);
    });
  }
};

function _getText(result, nodeList) {
  var index = -1;
  var length = nodeList.length;
  var entry;
  while (++index < length) {
    entry = nodeList[index];
    result.push(entry.data == undefined ? '' : nodeList[index].data);
    if (_hasChildren(entry)) {
      _getText(result, entry.children);
    }
  }
}

function _hasChildren(node) {
  return node.hasOwnProperty('children') && node.children.length > 0;
}

function _toChildren(node) {
  return node.children;
}

/**
 * Recursively search for all nodes in the {dom} tree inclusive of itself that
 * test true against {predicate}
 * 
 * @param {Array} result Matching nodes are pushed into this
 * @param {Array<object>} nodeList The dom to match and who's children to match
 * @param {function(object):boolean} predicate Test an entry on some condition
 */
function _find(result, predicate, nodeList) {
  var entry;
  var index = -1;
  var length = nodeList.length;
  while (++index < length) {
    entry = nodeList[index];
    if (predicate(entry)) {
      result.push(entry);
    }
    if (entry.hasOwnProperty('children')) {
      _find(result, entry.children, predicate);
    }
  }
}

module.exports = commands;