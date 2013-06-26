load('vertx.js');

var server = vertx.createHttpServer();

/** ****************************************** */
/** handle websocket connection */
/** ****************************************** */
server.websocketHandler(function(websocket) {
  console.log("websocket channel open");

  websocket.dataHandler(function(buffer) {
    console.log("received : " + buffer);
    var content = JSON.parse(buffer);
    websocket.writeTextFrame(JSON.stringify({
      header : {
        to : content.header.replyto
      },
      content : {
        "content" : "ok"
      }
    }));
    // bus.publish(obj);
  });

  websocket.closedHandler(function() {
    console.log("websocket channel closed");
  });
});

server.listen(vertx.config.port, "0.0.0.0");
console.log('execution service started on port ' + vertx.config.port);
