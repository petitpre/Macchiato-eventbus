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

module("Event bus");

// send a simple message to an handler
test("send message to an handler", function() {
  macchiato.createEventApplication(function(bus) {
    var subscriber = bus.subscribe(function(msg) {
      equal("bidule", msg.value, "check message content equality");
    });

    bus.send(subscriber, {
      value : "bidule"
    });
  });
});

// Send messages to multiple receivers using content filters
test("publish message to multiple handlers", function() {
  expect(2);

  macchiato.createEventApplication(function(bus) {
    var sub1 = bus.subscribe(function(msg) {
      equal("bidule", msg.value, "check message content equality");
    }, {
      '.*' : '.*'
    });
    var sub2 = bus.subscribe(function(msg) {
      equal("bidule", msg.value, "2nd check message content equality");
    }, {
      '.*' : '.*'
    });
    bus.publish({
      value : "bidule"
    });
  });

});

test("reply to a message", function() {
  expect(2);

  macchiato.createEventApplication(function(bus) {

    var subscriber = bus.subscribe(function(msg, reply) {
      equal("bidule", msg.value, "check message content equality");
      reply({
        reply : "replied"
      });
    });

    var future = bus.send(subscriber, {
      value : "bidule"
    });
    future.when(function(reply) {
      equal("replied", reply.reply, "check message reply equality");
    });
  });
});

asyncTest("create and use a channel", function() {
  expect(1);

  macchiato.createEventApplication(function(bus) {

    bus.createChannel("ws://localhost:8091").when(function(channel) {
      channel.send({
        "content" : "Hello, World 4"
      }).when(function(reply) {
        ok(true, "yeah, ca marche !");
        start();
        channel.close();
      });
    });
  });
});
