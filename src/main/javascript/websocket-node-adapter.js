/**
 * Macchiato : Mobile and Web application offloading Copyright (C) 2013 Nicolas
 * Petitprez
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

// This adapter allow to use websocket like api for server side client websocket
(function() {
  var WebSocketClient = require('websocket').client;

  var WebSocket = function(url) {
    var that = this;
    var client = new WebSocketClient();
    client.on('connectFailed', function() {
      that.onerror();
    });
    client.on('connect', function(connection) {
      that.send = function(content) {
        connection.sendUTF(content);
      };
      connection.on('close', function() {
        that.onclose();
      });
      connection.on('message', function(message) {
        if (message.type === 'utf8') {
          that.onmessage({
            data : message.utf8Data
          });
        }
      });
      that.close = function() {
        connection.close();
      };
      that.onopen();
    });

    client.connect(url, 'macchiato-protocol');

    this.onopen = function() {
    };
    this.onmessage = function(msg) {
    };
    this.onerror = function() {
    };
    this.onclose = function() {
    };
   
  };

  this.WebSocket = WebSocket;

})();