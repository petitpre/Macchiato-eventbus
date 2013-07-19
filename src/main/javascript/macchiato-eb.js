/**
 * Macchiato : Mobile and Web application offloading
 * 
 * Copyright (C) 2013 Nicolas Petitprez
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later
 * version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU General Public License along with
 * this program. If not, see <http://www.gnu.org/licenses/>.
 */
(function() {
  if (typeof require != 'undefined')
    require("./macchiato-commons.js");

  var log = macchiato.logger("eb");

  var guid = function() {
    var S4 = function() {
      return Math.floor(Math.random() * 0x10000 /* 65536 */
      ).toString(16);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4()
        + S4() + S4());
  };

  /*****************************************************************************
   * event filters
   ****************************************************************************/
  var filters = {
    all : function() {
      return true;
    }
  };

  /*****************************************************************************
   * Event Bus
   ****************************************************************************/
  var EventBus = function() {
    var handlers = {};

    /**
     * Register a new handler at specified address
     */
    this.subscribe = function(handler, filter) {
      var subscription = this.silentSubscribe(handler, filter, true);
      this.publish({
        subscription : subscription
      });
      return subscription;
    };

    this.silentSubscribe = function(handler, filter, local) {
      if (!handler)
        throw "handler not specified";

      var id = guid();

      log.fine("subscribe handler " + " with id : " + id + " and filter : "
          + JSON.stringify(filter));
      handlers[id] = {
        filter : filter,
        handler : handler,
        local : local
      };

      var subscription = {
        id : id,
        filter : filter
      };

      return subscription;
    };

    /**
     * Unregister a new handler at specified address
     */
    this.unsubscribe = function(subscription) {
      if (!subscription || !subscription.id)
        throw "you cannot register handler without subscription";

      if (handlers[subscription.id]) {
        log.fine("unsubscribe handler " + subscription.id);
        delete handlers[subscription.id];

        this.publish({
          "unsubscription" : {
            "id" : subscription.id
          }
        });
      } else {
        throw "unable to unregister handler: not found";
      }
    };

    /**
     * Tell if a filter match with a JSON object
     */
    var filterMatch = function(filter, obj) {
      var match = true;
      var patt;
      if (typeof filter == "undefined") {
        return false;
      } else if (typeof filter == "string") {
        patt = new RegExp(filter);
        try {
          return patt.test(JSON.stringify(obj));
        } catch (err) {
          return false;
        }
      } else if (typeof filter == "function") {
        return filter(obj);
      }

      // filter properties
      for ( var filterprop in filter) {
        patt = new RegExp(filterprop);
        var propertyfound = false;
        for ( var objprop in obj) {
          if (patt.test(objprop)) {
            propertyfound = true;
            match &= filterMatch(filter[filterprop], obj[objprop]);
          }
        }
        match &= propertyfound;
      }
      return match;
    };

    /**
     * Send a message to all handlers that listen for this address
     */
    this.publish = function(message) {
      for ( var id in handlers) {
        var filter = handlers[id].filter;
        if (filterMatch(filter, message)) {
          try {
            handlers[id].handler(message);
          } catch (err) {
            log.warning("unable to publish message " + err);
          }
        }
      }
    };

    this.send = function(dest, message) {
      var future = new Future();
      handlers[dest.id].handler(message, future.fulfill);

      return future;
    };

    var bus = this;
    /**
     * send current and futures registrations in any new channel
     */
    bus.silentSubscribe(function(msg) {
      // when connected, send all previously registered handlers
      for ( var id in handlers) {
        if (handlers[id].local === true) {
          msg.channel.sendSubscription({
            subscription : {
              id : id,
              filter : handlers[id].filter
            }
          });
        }
      }
      // register to any new subscription
      bus.silentSubscribe(function(m) {
        msg.channel.sendSubscription(m);
      }, {
        "subscription" : ".*"
      });

      msg.channel.send(JSON.stringify({
        initialized : true
      }));
    }, {
      channel : filters.all
    });

    this.createChannel = function(url) {
      var bus = this;

      // TODO use a different channel for each URL protocol
      // var channel = new SocketIOChannel(url);
      var channel = new WSChannel(url, this);

      var future = new Future();
      future.when(function(channel) {
        bus.publish({
          channel : channel
        });
      });
      channel.onConnected(future.fulfill);
      channel.connect();

      return future;
    };
  };

  /*****************************************************************************
   * Channel definition
   ****************************************************************************/

  var channellogger = macchiato.logger("channel");
  var Channel = macchiato.Class.extend({
    initialization : function(bus) {
      this.bus = bus;
    },
    cleanup : function() {
      // TODO remove all registered handlers
    },
    onConnected : function(connectionHandler) {
      this.connectionHandler = connectionHandler;
    },
    onReceived : function(msg) {
      var channel = this;
      var content = JSON.parse(msg);
      if (typeof content.subscription != "undefined") {
        channel.bus.silentSubscribe(function(msg) {
          channel.sendMessage(msg);
        }, content.subscription.filter);
      } else if (typeof content.initialized != "undefined") {
        if (typeof this.connectionHandler != "undefined")
          this.connectionHandler(this);
      } else if (typeof content.content != "undefined") {
        channel.bus.publish(content.content);
      }
    },
    sendMessage : function(msg) {
      this.send(JSON.stringify({
        content : msg
      }));
    },
    sendSubscription : function(subscription) {
      this.send(JSON.stringify(subscription));
    },
    send : function() {
      throw "not defined";
    },
    onDisconnect : function() {

    }
  });

  var WSChannel = Channel.extend({
    initialize : function(url, bus) {
      this.url = url;
      this.bus = bus;
    },
    connect : function(future) {
      channellogger.fine("connect channel " + this.id + " to destination "
          + this.url);

      this.socket = new WebSocket(this.url, 'macchiato-protocol');
      var channel = this;
      this.socket.onopen = function(event) {
        channellogger.info("connected to " + channel.url);
      };
      this.socket.onclose = function() {
        channellogger.info("connection closed : " + this.url);
        channel.onDisconnect();
        channel.cleanup();
        // TODO handle reconnection ?
      };
      this.socket.onmessage = function(message) {
        channellogger.info("received message : " + message.data);
        channel.onReceived(message.data);
      };
      this.socket.onerror = function(error) {
        channellogger.fine("websocket error : " + error);
        // TODO: reconnect ?
      };
      this.send = function(msg) {
        channellogger.fine("send message " + msg + " to " + channel.url);
        channel.socket.send(msg);
      };
      this.close = function() {
        channel.socket.close();
      };
    }
  });

  /*****************************************************************************
   * Event bus DSL
   ****************************************************************************/

  var createEventApplication = function(applicationHandler) {
    var eb = new EventBus();
    applicationHandler(eb);
  };

  /*****************************************************************************
   * exports
   ****************************************************************************/
  macchiato.createEventApplication = createEventApplication;
  macchiato.filters = filters;
  macchiato.Channel = Channel;

  if (this.module && module.exports) {
    module.exports = macchiato;
  } else {
    this.macchiato = macchiato;
  }
})();