const Url = require('url');
const http = require('http');
const Utils = require('../src/core/utils.js');
const selector = require('../src/core/selector.js');

const requestDefaults = {
  method: 'GET',
  headers: {},
};

function _onlineRequest(requestUrl, options) {
  const urlObj = Url.parse(requestUrl);
  return new Promise(function (resolve, reject) {
    const headers = Utils.settingsOver(requestDefaults, options);
    headers.port = urlObj.port; // Deferring port setting to the URL
    headers.hostname = urlObj.hostname;
    headers.path = urlObj.path;
    
    http.get(headers, function(response) {
      response.setEncoding('utf8');
      if (response.statusCode === 200) {
        var body = '';
        response.on('data', function (data) {
          body += data;
        }).on('end',function () {
          resolve(body);
        }).on('error',function (error) { // receive error (not sure this is needed)
          reject(error);
        });
      } else { // Bad error code
        reject(`Error code ${response.statusCode}`);
      }
    }).on('error', function (error) { // send error
      reject(error);
    });
  });
}

const url = 'http://ncode.syosetu.com/n6483cy/1/';

//const a = selector.parseWrapper(url.match(/<body.+</body>/));
_onlineRequest(url).then(function (data) {
  var dom = selector.parse(data);
  var body = selector.find('#novel_color', dom);
  //console.log(dom);
  
  //console.log(selector.stepQuery(['div', 'div','div','.novel_view'], selector.find('body', dom))[0].attribs);
  //console.log(selector.stepQuery(['.novel_view'], body)[0].attribs);
  //console.log(selector.stepQuery(['p'], body));
  //console.log(selector.stepQuery(['.novel_subtitle'], body));
  //console.log(selector.find('.novel_view', body));
  console.log(selector.query(['#novel_color', '.novel_subtitle'], dom));
});