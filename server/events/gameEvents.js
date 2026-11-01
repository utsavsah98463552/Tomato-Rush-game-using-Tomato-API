/**
 * gameEvents.js - server-side event hub (EVENT-DRIVEN ARCHITECTURE).
 * Author: Utsav Sah
 *
 * One shared Node.js EventEmitter. Parts of the server publish events and other parts
 * subscribe, without importing each other.
 *
 *   Event            Emitted by                 Listened to by
 *   ---------------  -------------------------  ---------------------------------
 *   game:finished    gameService (via routes)   handlers.js -> saves the score
 *   score:saved      handlers.js                leaderboard live stream (week 7)
 *
 * Reference: Node.js docs, Events - https://nodejs.org/api/events.html
 */
'use strict';

const { EventEmitter } = require('events');

const gameEvents = new EventEmitter();
gameEvents.setMaxListeners(100); // one listener per open live-leaderboard connection

module.exports = gameEvents;
