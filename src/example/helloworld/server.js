require("../../main/javascript/macchiato-server.js");

/**
 * Sample
 */
macchiato.createServerApplication(function(bus, server) {

  bus.subscribe(function(msg) {
    console.log("received :" + JSON.stringify(msg));

    // send a hello reply
    bus.publish({
      welcome : msg.name
    });
  }, {
    hello : ".*"
  });

  // start server
  server.listen(8092);

});