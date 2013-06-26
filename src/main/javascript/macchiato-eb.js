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

  var log = macchiato.logger("eb");

  var guid = function() {
    var S4 = function() {
      return Math.floor(Math.random() * 0x10000 /* 65536 */
      ).toString(16);
    };
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4()
        + S4() + S4());
  };

  /**
   * Clone the object in parameter
   */
  var clone = function(obj) {
    var target = {};
    for ( var i in obj) {
      if (obj.hasOwnProperty(i)) {
        target[i] = obj[i];
      }
    }
    return target;
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
      if (!handler)
        throw "handler not specified";
      if (handler instanceof Channel)
        handler = handler.messageHandler;

      var id = guid();

      log.fine("subscribe handler " + id + " with filter : "
          + JSON.stringify(filter));
      handlers[id] = {
        filter : filter,
        handler : handler
      };
      return {
        id : id
      };
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
      if (typeof filter == "string") {
        patt = new RegExp(filter);
        return patt.test(JSON.stringify(obj));
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
          handlers[id].handler(message);
        }
      }
    };

    /**
     * Send a message to one handler that listen for this address
     */
    this.send = function(subscription, message) {
      if (handlers[subscription.id]) {
        var future = new Future();
        handlers[subscription.id].handler(message, future.deliver);
        return future;
      } else {
        log.warning("No handler for " + subscription);
      }
    };

    this.createChannel = function(url) {
      var future = new Future();
      var channel = new WSChannel(url);
      channel.connect(future);
      return future;
    };
  };

  /*****************************************************************************
   * Channel definition
   ****************************************************************************/
  var channellogger = macchiato.logger("channel");
  var Channel = macchiato.Class.extend({
    initialization : function() {
    },
    messageHandler : function(msg) {
      throw "Handle function not implemented for this channel";
    },
    wrap : function(msg, replyHandler) {
      var obj = {
        header : {},
        content : msg
      };
      if (replyHandler) {
        if (!this.replyhandlers)
          this.replyhandlers = {};

        var id = guid();
        this.replyhandlers[id] = replyHandler;
        obj.header.replyto = id;
      }
      return obj;
    },
    unwrap : function(msg) {
      var content = JSON.parse(msg);
      if (content.header && content.header.replyto) {
        console.log("handle reply to " + msg.header.replyto);
      } else if (content.header && content.header.to) {
        this.replyhandlers[content.header.to](content.content);
      }
    },
    onReceive : function(handler) {
      if (!this.receivers)
        this.receivers = [];
      this.receivers.push(handler);
    }
  });

  var WSChannel = Channel.extend({
    initialize : function(url) {
      this.url = url;
      this.id = guid();
    },
    connect : function(future) {
      channellogger.fine("connect channel " + this.id + " to destination "
          + this.url);

      this.socket = new WebSocket(this.url);
      var channel = this;
      this.socket.onopen = function(event) {
        channellogger.info("connected to " + channel.url);
        future.deliver(channel);
      };
      this.socket.onclose = function() {
        channellogger.info("connection closed : " + this.url);
      };
      this.socket.onmessage = function(message) {
        channellogger.info("received message : " + message.data);
        channel.unwrap(message.data);
      };
      this.send = function(msg) {
        channellogger.fine("send message " + JSON.stringify(msg) + " to "
            + channel.url);
        var future = new Future();
        channel.socket.send(JSON.stringify(channel.wrap(msg, future.deliver)));
        return future;
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

})();