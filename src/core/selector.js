var $ = require('../../lib/Compose/compose.js');

function _hasChildren(node) {
  return node.hasOwnProperty('children');
}
function _toChildren(node) {
  return node.children;
}

var Select = {
  generic: function (property, tag, node) {
    return $.filter(function (child) {
      return child[property] === tag;
    }, node);
  },
  attrib: function (property, tag, node) {
    return $.filter(function (child) {
      return child.hasOwnProperty('attribs') && child.attribs[property] === tag;
    }, node);
  },

  htmlTag: function (tagName) {
    return function (node) {
      return node.name === tagName;
    };
  },

  cssClass: function _cssClass(className) {
    return function (node) {
      return node.hasOwnProperty('attribs') && node.attribs.class === className;
    };
  },

  query: function (selectors, dom) {
    var $dom = $(dom);
    selectors.forEach(function (selector) {
      $dom.filter(_hasChildren).map(_toChildren).flatten(1);
      if (selector.startsWith('#')) {
        $dom.filter(Select.cssClass(selector.substr(1)));
      } else if (!selector.startsWith('')) {
        $dom.filter(Select.htmlTag(selector));
      }
      //console.log($dom.value());
    });
    return $dom.value();
  },
};

module.exports = Select;