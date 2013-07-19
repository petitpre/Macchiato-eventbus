(function() {
	// "use strict";

//	var Future = require('future'), Sequence = require('sequence');

	// This is being saved in case I later decide to require future-functions
	// rather than always passing `next`
	function handleResult(next, result) {
		// Do wait up; assume that any return value has a callback
		if ('undefined' !== typeof result) {
			if ('function' === typeof result.when) {
				result.when(next);
			} else if ('function' === typeof result) {
				result(next);
			} else {
				next(result);
			}
		}
	}

	/**
	 * Async Method Queing
	 */
	function Chainify(providers, modifiers, consumers, context, params) {
		var Model = {};

		if ('undefined' === typeof context) {
			context = null;
		}

		/**
		 * Create a method from a consumer These may be promisable (validate
		 * e-mail addresses by sending an e-mail) or return synchronously
		 * (selecting a random number of friends from contacts)
		 */
		function methodify(provider, sequence) {
			var methods = {};

			function chainify_one(callback, is_consumer) {
				return function() {
					var params = Array.prototype.slice.call(arguments);

					sequence
							.then(function() {
								var args = Array.prototype.slice
										.call(arguments), args_params = [], next = args
										.shift();

								args.forEach(function(arg) {
									args_params.push(arg);
								});
								params.forEach(function(param) {
									args_params.push(param);
								});
								params = undefined;

								if (is_consumer) {
									// Don't wait up, just keep on truckin'
									callback.apply(context, args_params);
									next.apply(null, args);
								} else {
									// Do wait up
									args_params.unshift(next);
									callback.apply(context, args_params);
								}

								// or
								// handleResult(next, result)
							});
					return methods;
				};
			}

			Object.keys(modifiers).forEach(function(key) {
				methods[key] = chainify_one(modifiers[key]);
			});

			Object.keys(consumers).forEach(function(key) {
				methods[key] = chainify_one(consumers[key], true);
			});

			return methods;
		}

		/**
		 * A model might be something such as Contacts The providers might be
		 * methods such as: all(), one(id), some(ids), search(key, params),
		 * search(func), scrape(template)
		 */
		function chainify(provider, key) {
			return function() {
				var args = Array.prototype.slice.call(arguments), future = Future(), sequence = Sequence();

				// provide a `next`
				args.unshift(future.deliver);
				provider.apply(context, args);

				sequence.then(future.when);

				return methodify(providers[key], sequence);
			};
		}

		Object.keys(providers).forEach(function(key) {
			Model[key] = chainify(providers[key], key);
		});

		return Model;
	}
	(this.module && module.exports) ? module.exports = Chainify
			: this.Chainify = Chainify;
}());

/*jshint laxcomma:true node:true es5:true onevar:true */
(function() {
//	"use strict";

	var MAX_INT = Math.pow(2, 52);

	function isFuture(obj) {
		return obj instanceof Future;
	}

	function FutureTimeoutException(time) {
		this.name = "FutureTimeout";
		this.message = "timeout " + time + "ms";
	}

	//
	function privatize(obj, pubs) {
		var result = {};
		pubs.forEach(function(pub) {
			result[pub] = function() {
				obj[pub].apply(obj, arguments);
				return result;
			};
		});
		return result;
	}

	function Future(global_context, options) {
		if (!isFuture(this)) {
			return new Future(global_context, options);
		}

		var self = this;

		self._everytimers = {};
		self._onetimers = {};
		self._index = 0;
		self._deliveries = 0;
		self._time = 0;
		// self._asap = false;
		self._asap = true;

		// self._data;
		// self._timeout_id;

		self._passenger = null;
		self.fulfilled = false;

		self._global_context = global_context;

		// TODO change `null` to `this`
		self._global_context = ('undefined' === typeof self._global_context ? null
				: self._global_context);

		self._options = options || {};
		self._options.error = self._options.error || function(err) {
			throw err;
		};

		self.errback = function() {
			if (arguments.length < 2) {
				self.deliver.call(self, arguments[0]
						|| new Error("`errback` called without Error"));
			} else {
				self.deliver.apply(self, arguments);
			}
		};

		self.callback = function() {
			var args = Array.prototype.slice.call(arguments);

			args.unshift(undefined);
			self.deliver.apply(self, args);
		};

		self.fulfill = function() {
			if (arguments.length) {
				self.deliver.apply(self, arguments);
			} else {
				self.deliver();
			}
			self.fulfilled = true;
		};

		self.when = function(callback, local_context) {
			// this self._index will be the id of the everytimer
			self._onetimers[self._index] = true;
			self.whenever(callback, local_context);

			return self;
		};

		self.whenever = function(callback, local_context) {
			var id = self._index, everytimer;

			if ('function' !== typeof callback) {
				self._options
						.error(new Error(
								"Future().whenever(callback, [context]): callback must be a function."));
				return;
			}

			if (self._findCallback(callback, local_context)) {
				// TODO log
				self._options
						.error(new Error(
								"Future().everytimers is a strict set. Cannot add already subscribed `callback, [context]`."));
				return;
			}

			everytimer = self._everytimers[id] = {
				id : id,
				callback : callback,
				context : (null === local_context) ? null
						: (local_context || self._global_context)
			};

			if (self._asap && self._deliveries > 0) {
				// doesn't raise deliver count on purpose
				everytimer.callback.apply(everytimer.context, self._data);
				if (self._onetimers[id]) {
					delete self._onetimers[id];
					delete self._everytimers[id];
				}
			}

			self._index += 1;
			if (self._index >= MAX_INT) {
				self._cleanup(); // Works even for long-running processes
			}

			return self;
		};

		self.deliver = function() {
			if (self.fulfilled) {
				self._options
						.error(new Error(
								"`Future().fulfill(err, data, ...)` renders future deliveries useless"));
				return;
			}

			var args = Array.prototype.slice.call(arguments);
			self._data = args;

			self._deliveries += 1; // Eventually reaches `Infinity`...

			Object
					.keys(self._everytimers)
					.forEach(
							function(id) {
								var everytimer = self._everytimers[id], callback = everytimer.callback, context = everytimer.context;

								if (self._onetimers[id]) {
									delete self._everytimers[id];
									delete self._onetimers[id];
								}

								// TODO
								callback.apply(context, args);
								/*
								 * callback.apply(('undefined' !== context ?
								 * context : newme), args); context = newme;
								 * context = ('undefined' !== global_context ?
								 * global_context : context) context =
								 * ('undefined' !== local_context ?
								 * local_context : context)
								 */
							});

			if (args[0] && "FutureTimeout" !== args[0].name) {
				self._resetTimeout();
			}

			return self;
		};
	}

	Future.prototype.setContext = function(context) {
		var self = this;

		self._global_context = context;
	};

	Future.prototype.setTimeout = function(new_time) {
		var self = this;

		self._time = new_time;
		self._resetTimeout();
	};

	Future.prototype._resetTimeout = function() {
		var self = this;

		if (self._timeout_id) {
			clearTimeout(self._timeout_id);
			self._timeout_id = undefined;
		}

		if (self._time > 0) {
			self._timeout_id = setTimeout(function() {
				self.deliver(new FutureTimeoutException(self._time));
				self._timeout_id = undefined;
			}, self._time);
		}
	};

	Future.prototype.callbackCount = function() {
		var self = this;

		return Object.keys(self._everytimers).length;
	};

	Future.prototype.deliveryCount = function() {
		var self = this;

		return self._deliveries;
	};

	Future.prototype.setAsap = function(new_asap) {
		var self = this;

		if (undefined === new_asap) {
			new_asap = true;
		}

		if (true !== new_asap && false !== new_asap) {
			self._options.error(new Error(
					"Future.setAsap(asap) accepts literal true or false, not "
							+ new_asap));
			return;
		}

		self._asap = new_asap;
	};

	Future.prototype._findCallback = function(callback, context) {
		var self = this, result;

		Object
				.keys(self._everytimers)
				.forEach(
						function(id) {
							var everytimer = self._everytimers[id];

							if (callback === everytimer.callback) {
								if (context === everytimer.context
										|| everytimer.context === self._global_context) {
									result = everytimer;
								}
							}
						});

		return result;
	};

	Future.prototype.hasCallback = function() {
		var self = this;

		return !!self._findCallback.apply(self, arguments);
	};

	Future.prototype.removeCallback = function(callback, context) {
		var self = this, everytimer = self._findCallback(callback, context);

		if (everytimer) {
			delete self._everytimers[everytimer.id];
			self._onetimers[everytimer.id] = undefined;
			delete self._onetimers[everytimer.id];
		}

		return self;
	};

	Future.prototype.passable = function() {
		var self = this;

		self._passenger = privatize(self, [ "when", "whenever" ]);

		return self._passenger;
	};

	// this will probably never get called and, hence, is not yet well tested
	Future.prototype._cleanup = function() {
		var self = this, new_everytimers = {}, new_onetimers = {};

		self._index = 0;
		Object
				.keys(self._everytimers)
				.forEach(
						function(id) {
							var newtimer = new_everytimers[self._index] = self._everytimers[id];

							if (self._onetimers[id]) {
								new_onetimers[self._index] = true;
							}

							newtimer.id = self._index;
							self._index += 1;
						});

		self._onetimers = new_onetimers;
		self._everytimers = new_everytimers;
	};

	function create(context, options) {
		// TODO use prototype hack instead of new?
		return new Future(context, options);
	}

	Future.prototype.isFuture = isFuture;

	Future.isFuture = isFuture;
	Future.create = create;
	
	(this.module && module.exports) ? module.exports = Future
			: this.Future = Future;
}());

/*jshint strict:true node:true es5:true onevar:true laxcomma:true laxbreak:true*/
(function() {
	// "use strict";

	var Future = this.Future;

	function isJoin(obj) {
		return obj instanceof Join;
	}

	function Join(global_context) {
		var self = this, data = [], ready = [], subs = [], promise_only = false, begun = false, updated = 0, join_future = Future
				.create(global_context);

		global_context = global_context || null;

		if (!isJoin(this)) {
			return new Join(global_context);
		}

		function relay() {
			var i;
			if (!begun || updated !== data.length) {
				return;
			}
			updated = 0;
			join_future.deliver.apply(join_future, data);
			data = new Array(data.length);
			ready = new Array(ready.length);
			// for (i = 0; i < data.length; i += 1) {
			// data[i] = undefined;
			// }
		}

		function init() {
			var type = (promise_only ? "when" : "whenever");

			begun = true;
			data = new Array(subs.length);
			ready = new Array(ready.length);

			subs.forEach(function(sub, id) {
				sub[type](function() {
					var args = Array.prototype.slice.call(arguments);
					data[id] = args;
					if (!ready[id]) {
						ready[id] = true;
						updated += 1;
					}
					relay();
				});
			});
		}

		self.deliverer = function() {
			var future = Future.create();
			self.add(future);
			return future.deliver;
		};
		self.newCallback = self.deliverer;

		// fn, ctx
		self.when = function() {
			if (!begun) {
				init();
			}
			join_future.when.apply(join_future, arguments);
		};

		// fn, ctx
		self.whenever = function() {
			if (!begun) {
				init();
			}
			join_future.whenever.apply(join_future, arguments);
		};

		self.add = function() {
			if (begun) {
				throw new Error(
						"`Join().add(Array<future> | subs1, [subs2, ...])` requires that all additions be completed before the first `when()` or `whenever()`");
			}
			var args = Array.prototype.slice.call(arguments);
			if (0 === args.length) {
				return self.newCallback();
			}
			args = Array.isArray(args[0]) ? args[0] : args;
			args
					.forEach(function(sub) {
						if (!sub.whenever) {
							promise_only = true;
						}
						if (!sub.when) {
							throw new Error(
									"`Join().add(future)` requires either a promise or future");
						}
						subs.push(sub);
					});
		};
	}

	function createJoin(context) {
		// TODO use prototype instead of new
		return (new Join(context));
	}

	Join.create = createJoin;
	Join.isJoin = isJoin;

	(this.module && module.exports) ? module.exports = Join : this.Join = Join;
}());

(function () {
//  "use strict";
 
  function MaxCountReached(max_loops) {
      this.name = "MaxCountReached";
      this.message = "Loop looped " + max_loops + " times";
  }

  function timestamp() {
    return (new Date()).valueOf();
  }

  function loop(context) {
    var self = this,
      future = Future(),
      min_wait = 0,
      count = 0,
      max_loops = 0,
      latest,
      time,
      timed_out,
      timeout_id,
      data,
      callback;

    self.setMaxLoop = function (new_max) {
      max_loops = new_max;
      return self;
    };



    self.setWait = function (new_wait) {
      min_wait = new_wait;
      return self;
    };



    self.setTimeout = function (new_time) {
      if (time) {
        throw new Error("Can't set timeout, the loop has already begun!");
      }
      time = new_time;
      var timeout_id = setTimeout(function () {
        timed_out = true;
        future.deliver(new Error("LoopTimeout"));
      }, time);

      future.when(function () {
        clearTimeout(timeout_id);
      });
      return self;
    };



    function runAgain() {
      var wait = Math.max(min_wait - (timestamp() - latest), 0);
      if (isNaN(wait)) {
        wait = min_wait;
      }

      if (timed_out) {
        return;
      }
      if (max_loops && count >= max_loops) {
        future.deliver(new MaxCountReached(max_loops));
        return;
      }

      data.unshift(next);
      setTimeout(function () {
        latest = timestamp();
        try {
          callback.apply(context, data);
          count += 1;
        } catch(e) {
          throw e;
        }
      }, wait);
    }



    function next() {
      // dirty hack to turn arguments object into an array
      data = Array.prototype.slice.call(arguments);
      if ("break" === data[0]) {
        data.shift();
        future.deliver.apply(future, data);
        return;
      }
      runAgain();
    }



    self.run = function (doStuff) {
      // dirty hack to turn arguments object into an array
      data = Array.prototype.slice.call(arguments);
      callback = doStuff;
      data[0] = undefined;
      next.apply(self, data);
      return self;
    };



    self.when = future.when;
    self.whenever = future.whenever;

  }



  function Loop(context) {
    // TODO use prototype instead of new
    return (new loop(context));
  }
  

  (this.module && module.exports) ? module.exports = Loop : this.Loop = Loop;
}());
(function () {
//  "use strict";

  function isSequence(obj) {
    return obj instanceof Sequence;
  }

  function Sequence(global_context) {
    var self = this,
      waiting = true,
      data,
      stack = [];

    if (!isSequence(this)) {
      return new Sequence(global_context);
    }

    global_context = global_context || null;

    function next() {
      var args = Array.prototype.slice.call(arguments),
        seq = stack.shift(); // BUG this will eventually leak

      data = arguments;

      if (!seq) {
        // the chain has ended (for now)
        waiting = true;
        return;
      }

      args.unshift(next);
      seq.callback.apply(seq._context, args);
    }

    function then(callback, context) {
      if ('function' !== typeof callback) {
        throw new Error("`Sequence().then(callback [context])` requires that `callback` be a function and that `context` be `null`, an object, or a function");
      }
      stack.push({
        callback: callback,
        _context: (null === context ? null : context || global_context),
        index: stack.length
      });

      // if the chain has stopped, start it back up
      if (waiting) {
        waiting = false;
        next.apply(null, data);
      }

      return self;
    }

    self.next = next;
    self.then = then;
  }

  function createSequence(context) {
    // TODO use prototype instead of new
    return (new Sequence(context));
  }
  Sequence.create = createSequence;
  Sequence.isSequence = isSequence;

	(this.module && module.exports) ? module.exports = Sequence
			: this.Sequence = Sequence;
}());
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
  var macchiato = macchiato || {};

  var levels = {
    eb : 5,
    vertx : 5,
    channel : 5,
    server : 5
  // actors : 3,
  // vertx : 3
  // deployer : 5
  // manager : 5
  };

  var logger = function(name) {
    console.log("create logger " + name);
    var level = levels[name] ? levels[name] : 1;

    return {
      error : function(msg) {
        if (level > 0)
          console.log("[" + name + "][ERROR] " + msg);
      },
      warning : function(msg) {
        if (level > 1)
          console.log("[" + name + "][WARN] " + msg);
      },
      info : function(msg) {
        if (level > 2)
          console.log("[" + name + "][INFO] " + msg);
      },
      debug : function(msg) {
        if (level > 3)
          console.log("[" + name + "][DEBUG] " + msg);
      },
      fine : function(msg) {
        if (level > 4)
          console.log("[" + name + "][FINE] " + msg);
      }
    };
  };

  var Class = function() {
    if (this.initialize)
      this.initialize.apply(this, arguments);
  };
  Class.extend = function(childPrototype) {
    var parent = this;
    var child = function() {
      return parent.apply(this, arguments);
    };
    child.extend = parent.extend;
    var Surrogate = function() {
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();
    for ( var key in childPrototype) {
      child.prototype[key] = childPrototype[key];
    }
    return child;
  };

  macchiato.logger = logger;
  macchiato.Class = Class;

  if (this.module && module.exports) {
    module.exports = macchiato;
  } else {
    this.macchiato = macchiato;
  }

})();
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