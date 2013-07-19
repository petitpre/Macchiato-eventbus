require("../../main/javascript/macchiato-server.js");

/**
 * Sample
 */
macchiato.createServerApplication(function(bus) {

  bus.subscribe(function(msg) {
    console.log("received :" + JSON.stringify(msg));

    // send a hello reply
    bus.publish({
      welcome : "Welcome " + msg.name
    });
  }, {
    hello : ".*"
  });

}).listen(8092);
