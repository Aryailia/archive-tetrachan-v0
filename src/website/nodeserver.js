const http = require('http');
const url =  require('url');

/*http.createServer(function(request, response) {
  var proxy = http.createClient(80, request.headers['host']);
  var proxy_request = proxy.request(request.method, request.url, request.headers);
  proxy_request.addListener('response', function (proxy_response) {
    proxy_response.addListener('data', function(chunk) {
      response.write(chunk, 'binary');
    });
    proxy_response.addListener('end', function() {
      response.end();
    });
    response.writeHead(proxy_response.statusCode, proxy_response.headers);
  });
  request.addListener('data', function(chunk) {
    proxy_request.write(chunk, 'binary');
  });
  request.addListener('end', function() {
    proxy_request.end();
  });
}).listen(8080);*/

http.createServer(function (requestProxy, responseProxy) {
  const match = requestProxy.url.match(/^\/http/);
  if (match == null) {
    responseProxy.end(`Error with ${requestProxy.url}`);
    return;
  }

  const target = url.parse(requestProxy.url.substr(1));
  responseProxy.setHeader('Access-Control-Allow-Origin', '*');
  responseProxy.setHeader('Access-Control-Request-Method', '*');
  responseProxy.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  responseProxy.setHeader('Access-Control-Allow-Headers', '*');
  //console.log(target);

  var options = {
    hostname: target.host,
    port: 80,
    path: target.path,
    method: 'GET'
  };

  http.request(options, function (response) {
    response.on('data', function (chunk) {
      responseProxy.write(chunk, '');
    });

    response.on('end', function () {
      responseProxy.end();
    });
  }).end();
}).listen(8080);


console.log('Server is listening');
