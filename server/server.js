var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(8080);


var http = require('http');
var qs = require('querystring');

var frontport = 10000;
var backport = 10001;

var Queue = function() {
  this.data = [];
};

Queue.prototype.push = function(event) {
  this.data.push(event);
};

Queue.prototype.pop = function() {
  if (this.data.length > 0) {
    var item = this.data.splice(0, 1);
    return item[0];
  }
  return undefined;
};

var tofront = new Queue();
var toback = new Queue();

function createServer(port, readqueue, writequeue) {
  http.createServer(function (req, res) {
    if (req.method == 'GET') {
      var item = readqueue.pop();
      res.writeHead(200, {'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*'});
      var json = '[]';
      if (item) json = JSON.stringify([item]);
      res.end(json);
    } else if (req.method == 'POST') {
      var body = '';
      req.on('data', function (data) {
        body += data;
      });
      req.on('end', function () {
        var POST = qs.parse(body);
        console.log('POSTED', POST);
        if (POST['event'] && POST['event'].length > 0)
          writequeue.push(JSON.parse(POST['event']));
      });
      res.writeHead(200, {'Content-Type': 'text/javascript'});
      res.end('{\"ok\":1}\n');
    }
  }).listen(port, '127.0.0.1');
}

createServer(frontport, tofront, toback);
createServer(backport, toback, tofront);

console.log('Loopback running!');
console.log();
console.log('Frontend on port '+frontport);
console.log('$ Post to backend: curl --data "event={\\"data\\":354}" http://127.0.0.1:'+frontport+'/');
console.log('$ Poll frontend queue: curl http://127.0.0.1:'+frontport+'/');
console.log();
console.log('Backend on port '+backport);
console.log('$ Post to frontend: curl --data "event={\\"data\\":123}" http://127.0.0.1:'+backport+'/');
console.log('$ Poll backend queue: curl http://127.0.0.1:'+backport+'/');