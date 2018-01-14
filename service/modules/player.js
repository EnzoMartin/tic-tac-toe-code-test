const async = require('async');
const { redis } = require('../config');

/**
 * Register a given player as having connected with a socket
 * @param {String} playerId
 * @param {String} socketId
 * @param {Function} callback
 */
const addConnectedSocket = (playerId, socketId, callback) => {
  async.parallel([
    (callback) => { redis.sadd('players', playerId, callback); },
    (callback) => { redis.sadd(`player.${playerId}`, socketId, callback); }
  ], callback);
};

/**
 * Remove a socket connection from a player, and mark the player as offline if no other sockets connected
 * @param {String} playerId
 * @param {String} socketId
 * @param {Function} callback
 */
const removeConnectedSocket = (playerId, socketId, callback) => {
  const playerKey = `players.${playerId}`;
  redis.srem(playerKey, socketId, (err) => {
    if (err) {
      callback(err);
    } else {
      redis.scard(playerKey, (err, count) => {
        if (err || count) {
          callback(err);
        } else {
          redis.srem('players', playerId, callback);
        }
      });
    }
  });
};

/**
 * Get the list of currently online players
 * @param {Function} callback
 */
const getOnlineList = (callback) => {
  redis.smembers('players', callback);
};

module.exports = {
  addConnectedSocket,
  removeConnectedSocket,
  getOnlineList
};
