require("../../main/javascript/macchiato-server.js");

macchiato.logger("serverchannel").setLevel(6);
macchiato.logger("server").setLevel(6);


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
