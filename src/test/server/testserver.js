//Socket.io ping server
var io = require('socket.io').listen(8091);
io.sockets.on('connection', function(socket) {
  console.log("new socket.io connection");
  // io.sockets.emit('this', { will: 'be received by everyone'});

  socket.on('message', function(msg) {
    console.log('I received a private message  ', msg);
    var content = JSON.parse(msg);
    socket.send(JSON.stringify({
      header : {
        to : content.header.replyto
      },
      content : {
        "content" : "ok"
      }
    }));
  });

  socket.on('disconnect', function() {
    console.log('user disconnected');
  });
});

//websocket ping server
var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
  // process HTTP request. Since we're writing just WebSockets server
  // we don't have to implement anything.
});
server.listen(8092, function() {
});

//create the server
var wsServer = new WebSocketServer({
  httpServer : server
});

//WebSocket server
wsServer.on('request', function(request) {
  var connection = request.accept('macchiato-protocol', request.origin);
  console.log("new ws connection");

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function(message) {
    console.log("receive : " + message.utf8Data);
    var received = JSON.parse(message.utf8Data);
    
    var content = JSON.stringify({
      header : {
        to : received.header.replyto
      },
      content : {
        "content" : "ok"
      }
    })
    console.log("send : " + content);
    connection.send(content);
//    connection.close();
  });

  connection.on('close', function(connection) {
    console.log('user disconnected');
  });
});