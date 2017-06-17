var DISCORD_MESSAGE_LIMIT = 700;

function massMessage(messageList, sender) {
    function fitIntoLimit(lines, text) {
      var message = text + '\n';
      var last = lines[lines.length - 1];
      if (last.size <= DISCORD_MESSAGE_LIMIT) {
        last.buffer.push(message);
        //console.log(msg);
        last.size += message.length;
      } else {
        lines.push({ size: message.length, buffer: [message] });
      }
      return lines;
    }
    

    messageList
      // Refine list separation to prioritize messageList boundaries but fit into limit
      .reduce(fitIntoLimit, [{ size: 0, buffer: []}]) // Combine what will fit into a limit
      .reduce(function (list, x) { return list.concat(x.buffer); }, []) // Flatten

      // Refine list separation to prioritize newlines
      .map(function (messages) {
        var group = messages.split('\n') // Split along new lines
          .reduce(fitIntoLimit, [{ size: 0, buffer: []}]); // Combine if limit allows
        return group.map(function (newLineGroup) { 
          return newLineGroup.buffer.join(''); // Then flatten into string
        }); // return Array<Array<strings>>
      })
      .reduce(function (list, x) { return list.concat(x); }, []) // Flatten

      // Display
      .forEach(function (message) {
        var index = 0;
        var length = message.length;
        while (index < length) { // Not guarenteed to be under limit still
          sender(message.substr(index, DISCORD_MESSAGE_LIMIT));
          index += DISCORD_MESSAGE_LIMIT;
        }
      });
}

massMessage([`
What is Lorem Ipsum?

Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standar
d dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type spec
imen book. It has survived not only five centuries, but also the leap into electronic typesetting, 
remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset shee
ts containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus 
PageMaker including versions of Lorem Ipsum.

The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.
`, 'yoyoyoyo'], console.log);


/*var $ = require(require('path').resolve('./src/compose/Compose.js'));
console.log($([{
  word: '職',
  reading: 'しょく' 
}, {
  word: '食',
  reading: 'しょく' 
}]).filter((x,i) => i > 0).value());
*/
/*const http = require('http');

function onlineRequest(url, text, callback) {
  return http.get(//{
    //host:
    url + encodeURIComponent(text),
//    host: 'jisho.org',
//    path: '/api/v1/search/words?keyword=' + encodeURIComponent(text)
  //}, 
  function(response) {
    var body = ''; // Continuously update stream with data
    response.on('data', function(data) {
      body += data;
    });
    response.on('end', function() {
      var parsed = JSON.parse(body);
      return callback(parsed);
    });
  });
}

console.log(onlineRequest('http://jisho.org/api/v1/search/words?keyword=', '食', function (a) {
//  console.log(a);
}));
//*/