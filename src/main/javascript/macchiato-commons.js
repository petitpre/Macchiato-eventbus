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