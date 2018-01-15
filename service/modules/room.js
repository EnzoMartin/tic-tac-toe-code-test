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
  async.parallel({
    p2: (callback) => {
      redis.hsetnx(roomInfoKey(roomId), 'p2', playerId, callback);
    },
    playerId: (callback) => {
      redis.hsetnx(roomInfoKey(roomId), playerId, symbol, callback);
    },
    spectate: (callback) => {
      spectate(roomId, playerId, callback);
    }
  }, callback);
};

/**
 * Create a new room with the given player and symbol for that player
 * @param {String} playerId
 * @param {String} symbol
 * @param {Function} callback
 */
const create = (playerId, symbol, callback) => {
  const roomId = uuid();
  async.parallel([
    (callback) => {
      redis.hmset(roomInfoKey(roomId), {
        p1: playerId,
        [playerId]: symbol,
        size: '3,3'
      }, callback);
    },
    (callback) => { spectate(roomId, playerId, callback);}
  ], (err) => {
    callback(err, roomId);
  });
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
  redis.hgetall(roomInfoKey(roomId), callback);
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
  /*
  This isn't great, but is  a work-around for how ioredis applies a
  global transform to all commands of a type and I only want to change
  the behavior for this 1 data fetch, so I'll live with the shame,
  and I'm also very tired

  The reason to do this is to get back the actions in the order by which
  they were inserted in the form of an array. The transform gives back
  an object which does not guarantee key order and thus cannot be relied
  upon to see which player was the last one to make a move
    */
  async.parallel({
    keys: (callback) => { redis.hkeys(roomActionsKey(roomId), callback); },
    values: (callback) => { redis.hvals(roomActionsKey(roomId), callback); }
  }, (err, result) => {
    let data;
    if (result) {
      data = result.keys.map((key, index) => {
        return {
          key,
          value: result.values[index]
        };
      });
    }

    callback(err, data);
  });
};

/**
 * Get room info, actions, and participants
 * @param {String} roomId
 * @param {Function} callback
 */
const getSingle = (roomId, callback) => {
  async.parallel({
    id: (callback) => {
      callback(null, roomId);
    },
    info: (callback) => {
      getInfo(roomId, callback);
    },
    lobby: (callback) => {
      getLobby(roomId, callback);
    },
    actions: (callback) => {
      getActions(roomId, callback);
    }
  }, (err, result) => {
    let data;
    if (result) {
      data = {
        id: result.id,
        info: result.info,
        lobby: result.lobby,
        actions: result.actions,
        // Re-convert to an object for easier lookups of cell occupancy
        actionsMap: result.actions.reduce((items, item) => {
          items[item.key] = item.value;
          return items;
        }, {})
      };
    }

    callback(err, data);
  });
};

/**
 * Return a list of all rooms
 * @param {Function} callback
 */
const getAll = (callback) => {
  const promises = [];
  const stream = redis.scanStream({
    match: `${redisConfig.keyPrefix}${roomInfoKey('*')}`,
    count: 50
  });

  stream.on('data', (keys) => {
    keys.forEach((fullKey) => {
      const key = fullKey.replace(redisConfig.keyPrefix, '').split('.');
      const roomId = key[key.length - 2];

      promises.push((callback) => {
        getSingle(roomId, callback);
      });
    });
  });

  stream.on('end', () => {
    async.parallel(promises, callback);
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
