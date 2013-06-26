/**
 * Macchiato : Mobile and Web application offloading
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

load('vertx.js');

// include FutureJS 
load('main/javascript/futuresjs/future.js');
load('main/javascript/futuresjs/sequence.js');
load('main/javascript/futuresjs/chainify.js');
load('main/javascript/futuresjs/join.js');

// macchiato EB libraries
load('main/javascript/macchiato-commons.js');
load('main/javascript/macchiato-eb.js');
load('main/javascript/vertx-websocket.js');

// test
load('test/server/qunit-vertx.js');
load('test/javascript/eventbus.js');

run();