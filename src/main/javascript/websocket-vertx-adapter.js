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

/**
 * This module allow to use navigator-like websockets in a vert.x server
 */
(function() {
  load('vertx.js');

  var parseUrl = function(url) {
    var server = url.split("/")[2];
    var tmp = server.split(":");
    return {
      host : tmp[0],
      port : tmp[1]
    };
  };

  var WebSocket = function(url) {
    var parsedurl = parseUrl(url);
    console.log(JSON.stringify(parsedurl));
    var client = vertx.createHttpClient().setPort(parsedurl.port).setHost(
        parsedurl.host);
    var adapter = this;
    client.connectWebsocket(url, function(websocket) {
      adapter.websocket = websocket;
      websocket.closedHandler(adapter.onclose);
      websocket.dataHandler(function(buff) {
        adapter.onmessage({
          data : buff
        });
      });
      adapter.onopen();
    });

    this.onopen = function() {
    };
    this.onmessage = function(msg) {
    };
    this.onerror = function() {
    };
    this.onclose = function() {
    };

    this.send = function(content) {
      this.websocket.writeTextFrame(content);
    };
    this.close = function() {
      this.websocket.close();
    };
  };

  this.WebSocket = WebSocket;

})();