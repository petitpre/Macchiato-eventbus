require("../../main/javascript/macchiato-server.js");

/**
 * Sample
 */
macchiato.createServerApplication(function(bus, server) {

  bus.subscribe(function(msg) {
    bus.publish({
      "testresult" : "ok"
    });
  }, {
    "testcontent" : ".*"
  });

}).listen(8092);