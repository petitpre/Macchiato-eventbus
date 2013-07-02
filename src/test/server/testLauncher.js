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
// include FutureJS
require('../../../src/main/javascript/websocket-node-adapter.js');
require('../../main/javascript/futuresjs/future.js');
require('../../main/javascript/futuresjs/sequence.js');
require('../../main/javascript/futuresjs/chainify.js');
require('../../main/javascript/futuresjs/join.js');

// macchiato EB libraries
require('../../main/javascript/macchiato-commons.js');
require('../../main/javascript/macchiato-eb.js');

// test
require('./qunit-server.js');
require('../javascript/eventbus.js');

run();