Macchiato-eventbus
==================

Macchiato-eventbus is a distributed event bus written in JavaScript. 
It allow to distribute applications between your navigator, [node.js](http://nodejs.org/) application server, Java and Android application by using [Rhino](https://developer.mozilla.org/fr/docs/Rhino) script engine.
 
You can use Macchiato-eventbus to build [real-time web](http://en.wikipedia.org/wiki/Real-time_web) and mobile applications.

## Documentation 
* [Installation](#installation)
* [Two minutes tutorial](#tuto)
* [Core Concepts](#core-concepts)
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

Nous allons créer une application dont le serveur node.js lit les valeurs de la console et envoie un message avec chaque ligne.
Un client web se connectera a se serveur et affichera l'ensemble des messages saisie dans la console du serveur.

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

    



<h2 id="core-concepts">Core Concepts</h2>

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

Event-bus running in web browsers and Android can not accept incomming connections.


A server-side event bus can create a new channel to another server-side bus and can receive new connections.
Un bus d'evenement serveur peut se connecter à un autre bus d'evenement serveur et peut recevoir des connections
Un bus d'evenement client peut seulement se connecter à un bus d'evenement serveur. 

Typiquement, un bus serveur utilise node.js et est accessible.
Un bus client peut etre dans votre page web ou application android. 

Une fois les bus connectés par un channel, les événements des différents bus sont automatiquements routés entre les différents bus composants votre application.


    macchiato.createEventApplication(function(bus) {
      bus.createChannel("ws://localhost:8092").when(function() {
        console.log("connected to server !");
      });
    });

<h2 id="#build">Build</h2>

Prerequise:

you need to have node.js installed

clone git project
install node.js packages :
$> npm install

Build last version of Macchiato event bus :
$> grunt


run hello world server :
$> node src/example/helloworld/server.js

open page src/example/helloworld/client.html in your web browser.
 
<h2 id="#license">License</h2>