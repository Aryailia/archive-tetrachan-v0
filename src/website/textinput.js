'use strict';
// To do:
// - add sanity check to getQuote?
// - implement extract polyfill

var MAX_WORD_LENGTH;
//var asdf = document.getElementById('test').contentWindow.document;
var text = Object.create(null);

text.extract = function (ev, type) {
  if (ev.rangeParent.nodeType != Node.TEXT_NODE) {
    return '';
  }
  return ev.rangeParent.data.substr(ev.rangeOffset, MAX_WORD_LENGTH);
};

text.readRange;
if (true) {
  text.readRange = function (element) {
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel, range, preCaretRange, caretOffset = 0;
    if (typeof win.getSelection != "undefined") {
      sel = win.getSelection();
      console.log(sel);
      if (sel.rangeCount) {
        range = sel.getRangeAt(0);
        preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
      }
    }
    return caretOffset;
  };
}

text.getCaretCharacterOffsetWithin = function (element) {
  var doc = element.ownerDocument || element.document;
  var win = doc.defaultView || doc.parentWindow;
  var sel, range, preCaretRange, caretOffset = 0;
  if (typeof win.getSelection != "undefined") {
      sel = win.getSelection();
      if (sel.rangeCount) {
          range = sel.getRangeAt(0);
          preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(element);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          caretOffset = preCaretRange.toString().length;
      }
  } else if ( (sel = doc.selection) && sel.type != "Control") {
      range = doc.selection.createRange();
      preCaretRange = doc.body.createTextRange();
      preCaretRange.moveToElementText(element);
      preCaretRange.setEndPoint("EndToEnd", textRange);
      caretOffset = preCaretTextRange.text.length;
  }
  return caretOffset;
}; 
text.read = function (ev) {
  var range;
  var textNode;
  var offset;

  if (document.caretPositionFromPoint) { // Standard
    range = document.caretPositionFromPoint(ev.clientX, ev.clientY);
    textNode = range.offsetNode;
    offset = range.offset;
      
  } else if (document.caretRangeFromPoint) { // Webkit
    range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    textNode = range.startContainer;
    offset = range.startOffset;
  } else {
    throw new Error('Need to polyfill caretRangeFromPoint');
  }
  return range;
};

// Functions as the polyfill for document.caretPositionFromPoint
function extract(event) {
  let range = document.caretPositionFromPoint(event.clientX, event.clientY);
  return range;
/*  const element = document.elementFromPoint(point.x, point.y);
  if (element !== null) {
    if (element.nodeName === 'IMG' || element.nodeName === 'BUTTON') {
      return new TextSourceElement(element);
    } else if (imposter && (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA')) {
      docImposterCreate(element);
    }
  }

  //range = document.caretPositionFromPoint === undefine
  if (!document.caretRangeFromPoint) {
      document.caretRangeFromPoint = (x, y) => {
          const position = document.caretPositionFromPoint(x,y);
          if (position === null) {
              return null;
          }

          const range = document.createRange();
          range.setStart(position.offsetNode, position.offset);
          range.setEnd(position.offsetNode, position.offset);
          return range;
      };
  } else {}

  const range = document.caretRangeFromPoint(point.x, point.y);
  if (range !== null) {
      return new TextSourceRange(range);
  }

  return null;
//*/

}

module.exports = text;