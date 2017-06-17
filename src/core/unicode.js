// Useful link regarding white spaces:
// http://stackoverflow.com/questions/4300980/what-are-all-the-japanese-whitespace-characters
// http://www.fileformat.info/info/unicode/category/Zs/list.htm
// https://gist.github.com/ryanmcgrath/982242
// https://mathiasbynens.be/notes/javascript-escapes
// https://mothereff.in/js-escapes

// ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ
var toFullWidthKana = [
  'ヲ','ァ','ィ','ゥ','ェ','ォ','ャ','ュ','ョ','ｯ','ー','ア','イ','ウ','エ','オ',
  'カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ','タ','チ','ツ','テ','ト',
  'ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ','マ','ミ','ケ','メ','モ',
  'ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ン'
];

var obj = {
  convertHalfWidth: function (str) {
    const normalized = str
      .replace(/[\uff01-\uff5e]/g, // Roman full to ascii
        function(ch) { return String.fromCharCode(ch.charCodeAt(0) - 0xfee0); })
      .replace(/\uff61/g, '.') // Replace space
      .replace(/[\uff66-\uff9d]/g, // To full-width katakana
        function(ch) { return toFullWidthKana[ch.charCodeAt(0) - 0xff66]; })
      .replace(/\u3000/g, ' ')
      ;
    
    return normalized;
  },
  sanitize: function (str) {
    return obj.convertHalfWidth(str);
  },
  SPACE: '[' + [
    ' ', // U+0020, regular space
    '\t', // Tab
    '\u3000', // Ideographic space, aka. full-width space
  ].join('') + ']',
};


module.exports = obj;