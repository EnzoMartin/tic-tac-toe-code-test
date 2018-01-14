const uuid = require('uuid/v4');
const async = require('async');
const { redis, redisConfig } = require('../config');

/**
 * Returns the base Redis key for all room related keys
 * @param {String} roomId
 * @returns {string}
 */
function roomBaseKey(roomId) {
  return `room.${roomId}`;
}

/**
 * Returns the Redis key for a room's player information
 * @param {String} roomId
 * @returns {string}
 */
function roomInfoKey(roomId) {
  return `${roomBaseKey(roomId)}.info`;
}

/**
 * Returns the Redis key for a room's player actions
 * @param {String} roomId
 * @returns {string}
 */
function roomActionsKey(roomId) {
  return `${roomBaseKey(roomId)}.actions`;
}

/**
 * Returns the Redis key for a room's lobby
 * @param {String} roomId
 * @returns {string}
 */
function roomLobbyKey(roomId) {
  return `${roomBaseKey(roomId)}.lobby`;
}

/**
 * Join the given room's lobby as a spectator
 * @param {String} roomId
 * @param {String} playerId
 * @param {Function} callback
 */
const spectate = (roomId, playerId, callback) => {
  redis.sadd(roomLobbyKey(roomId), playerId, callback);
};

/**
 * Join the given room's lobby as a player
 * @param {String} roomId
 * @param {String} playerId
 * @param {String} symbol
 * @param {Function} callback
 */
const join = (roomId, playerId, symbol, callback) => {
  async.parallel([
    (callback) => { redis.hset(roomInfoKey(roomId), playerId, symbol, callback); },
    (callback) => { spectate(roomId, playerId, callback); }
  ], callback);
};

/**
 * Create a new room with the given player and symbol for that player
 * @param {String} playerId
 * @param {String} symbol
 * @param {Function} callback
 */
const create = (playerId, symbol, callback) => {
  const roomId = uuid();
  join(roomId, playerId, symbol, callback);
};

/**
 * Leave the lobby of a given room
 * @param {String} roomId
 * @param {String} playerId
 * @param {Function} callback
 */
const leave = (roomId, playerId, callback) => {
  redis.srem(roomLobbyKey(roomId), playerId, callback);
};

/**
 * Play a given cell by a given player in a given room, returns 0 if an action already exists on the given cell
 * @param {String} roomId
 * @param {String} playerId
 * @param {String} cell
 * @param {Function} callback
 */
const play = (roomId, playerId, cell, callback) => {
  redis.hsetnx(roomActionsKey(roomId), cell, playerId, callback);
};

/**
 * Get the information of the given room
 * @param {String} roomId
 * @param {Function} callback
 */
const getInfo = (roomId, callback) => {
  redis.hmgetall(roomInfoKey(roomId), callback);
};

/**
 * Get all currently connected players in the given room
 * @param {String} roomId
 * @param {Function} callback
 */
const getLobby = (roomId, callback) => {
  redis.smembers(roomLobbyKey(roomId), callback);
};

/**
 * Get all the actions performed in the given room
 * @param {String} roomId
 * @param {Function} callback
 */
const getActions = (roomId, callback) => {
  redis.hmgetall(roomActionsKey(roomId), callback);
};

/**
 * Get room info, actions, and participants
 * @param {String} roomId
 * @param {Function} callback
 */
const getSingle = (roomId, callback) => {
  async.parallel({
    info: (callback) => {
      getInfo(roomId, callback);
    },
    lobby: (callback) => {
      getLobby(roomId, callback);
    },
    actions: (callback) => {
      getActions(roomId, callback);
    }
  }, callback);
};

/**
 * Return a list of all rooms
 * @param {Function} callback
 */
const getAll = (callback) => {
  const rooms = [];
  const stream = redis.hscanStream({
    match: `${redisConfig.keyPrefix}${roomInfoKey('*')}`,
    count: 50
  });

  stream.on('data', (keys) => {
    keys.forEach((fullKey) => {
      const key = fullKey.replace(redisConfig.keyPrefix, '').split('.');
      const roomId = key[key.length - 1];

      redis.hmgetall(roomId, (err, data) => {
        if (err) {
          // Nothing really
        } else {
          rooms.push(data);
        }
      });
    });
  });

  stream.on('end', () => {
    callback(rooms);
  });
};

module.exports = {
  create,
  join,
  play,
  getSingle,
  getAll,
  spectate,
  leave
};
