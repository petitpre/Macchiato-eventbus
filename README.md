Macchiato-eventbus
==================

Macchiato-eventbus is a distributed event bus written in JavaScript. 
It allow to distribute applications between your navigator, [node.js](http://nodejs.org/) application server, Java and Android application by using [Rhino](https://developer.mozilla.org/fr/docs/Rhino) script engine.
 
You can use Macchiato-eventbus to build [real-time web](http://en.wikipedia.org/wiki/Real-time_web) and mobile applications.

## Documentation 
* [Installation](#installation)
* [Two minutes tutorial](#tuto)
* [Core Concepts](#coreconcepts)
* [Build](#build)
* [License](#license)

<h2 id="installation">Installation</h2>

### Using macchiato-eventbus in your webpage

To use the Macchiato-eventbus, you just have to reference the file from GitHub in the script tag:

    <script src="https://rawgithub.com/petitpre/Macchiato-eventbus/master/target/macchiato.min.js"></script>
    
You can also download a copy of macchiato-eventbus ([compressed](https://raw.github.com/petitpre/Macchiato-eventbus/master/target/macchiato.min.js) or [uncompressed](https://raw.github.com/petitpre/Macchiato-eventbus/master/target/macchiato.js)) and using it locally.

You can find a complete client-side event-bus [here](https://rawgithub.com/petitpre/Macchiato-eventbus/master/src/example/helloworld/clientonly.html).

### Using eventbus in your node.js applications

To use macchiato-eventbus in your node.js application, you need to install module macchiato-eventbus
    
    npm install macchiato-eventbus

You can use the bus event macchiato in your node.js application :

    require("macchiato-eventbus");
    
    macchiato.createServerApplication(function(bus) {
      // register to hello event
      bus.subscribe(function(msg) {
         console.log("received :" + JSON.stringify(msg));
      }, { hello : ".*" });
    
      // send a hello event
      bus.publish({ hello : "my name" });
    });

### Using Event-bus on Android applications

% TODO : create a giter8 template

<h2 id="tuto">Create a realtime-web application in two minutes</h2>

### Prerequisite

You need to have [node.js](http://nodejs.org/) installed on your computer.

We will create an application with two parts.
The first is a node.js server, which reads the values ​​from the console and publish an event with content.
The second is a web client connected to the server. It will display all messages entered into the server console.

In your project directory, use node package manager to install macchiato event-bus :

    npm install macchiato-eventbus
    
To create the server, put the following code into a file `server.js`

    require("macchiato-eventbus");

    macchiato.createServerApplication(function(bus) {
      // read standard input
      var sys = require("sys");
      var stdin = process.openStdin();
      stdin.addListener("data", function(d) {
        bus.publish({"entered" : d.toString().substring(0, d.length - 1) });
      });
    }).listen(8080);

To create the client, put the following code into a file `index.html`

    <!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Strict//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd'>
    <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="fr" lang="fr"><head><title>Hello world</title>

    <script src="https://rawgithub.com/petitpre/Macchiato-eventbus/master/target/macchiato.js"></script>
    <script src="http://code.jquery.com/jquery-1.10.1.min.js"></script>

    <script type="text/javascript">
      $(function() {
        macchiato.createEventApplication(function(bus) {
          bus.subscribe(function(msg) {
            $("#content").append(msg.entered + "<br/>");
          }, {'entered' : ".*" });
          bus.createChannel("ws://localhost:8080").when(function() {
            console.log("connected to server !");
          });
        });
      });
    </script>
    </head><body><div id="content"></div></body></html>
    
To run example, run server with command `node server.js` and open `index.html` in your browser.
The text entered in the server console will be displayed in the web page.

<h2 id="coreconcepts">Core Concepts</h2>

### Handler references

To send an event to an handler, you can use the handler reference :
    
    // register an handler with a reference
    var handlerref = bus.subscribe(function(msg) {
        // my event-handling code
    });
		// send message directly to handler
    bus.send("my event").to(handlerref);

The references may be useful in some cases, but it is preferable to use content-based filtering presented in the next section.

### Content-based subscription

In Macchiato-eventbus, we also provide a content-based filtering. You can specify a constraint when subscribing the handler.

    bus.subscribe(function(msg) {
      // your handling code
    },
    // content filter
     {
      'welcome' : ".*"
    });

This handler will match every message with a "welcome" property.
The properties of the subscription pattern are defined using JavaScript [regular expressions](http://www.w3schools.com/jsref/jsref_obj_regexp.asp).
Each filter properties is tested recursively against property of events.

### Creating a channel between two bus

To connect the bus events, we use channels. A channel is always open to the initiative of a client to a server.
Typically, the client is your web browser and the server is a server node.js.
An event-bus running in node.js can also establish a connection to another  node.js event-bus

Event-bus running in web browsers and Android can not accept incoming connections.

Once the event-bus are connected by a channel, the events from each event-bus are automatically routed to matching handlers. 

<h2 id="build">Build</h2>

you need to have node.js installed
   
install node.js dependencies :
    
    $> npm install

Build last version of Macchiato event bus :
    
    $> grunt

Uncompressed and compressed version of macchiato-eventbus are available in `target` directory
 
<h2 id="license">License</h2>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.