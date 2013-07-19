(function() {

  require("./macchiato-eb.js");

  var channellogger = macchiato.logger("serverchannel");
  var WSServerChannel = macchiato.Channel.extend({
    initialize : function(connection, bus) {
      this.connection = connection;
      this.bus = bus;

      var that = this;
      connection.on('message', function(message) {
        serverlogger.fine("receive : " + message.utf8Data);
        that.onReceived(message.utf8Data);
      });
      connection.on('close', function(connection) {
        console.log('user disconnected');
        that.cleanup();
      });

    },
    send : function(content) {
      channellogger.fine("send " + content);
      this.connection.send(content);
    }
  });

  var serverlogger = macchiato.logger("server");
  macchiato.createServerApplication = function(callback) {
    var serverfacade;

    macchiato.createEventApplication(function(bus) {
      serverfacade = {
        listen : function(port) {
          var WebSocketServer = require('websocket').server;
          var http = require('http');
          var server = http.createServer(function(request, response) {
            // process HTTP request. Since we're writing just WebSockets server
            // we don't have to implement anything.
          });
          server.listen(port, function() {
          });
          // create the server
          var wsServer = new WebSocketServer({
            httpServer : server
          });
          // WebSocket server
          wsServer.on('request', function(request) {
            serverlogger.fine("received new WS connection");
            var connection = request.accept('macchiato-protocol',
                request.origin);
            var channel = new WSServerChannel(connection, bus);
            bus.publish({
              channel : channel
            });
          });
          serverlogger.info("open server on port " + port);
        }
      };

      callback(bus);
    });
    return serverfacade;
  };
}());
