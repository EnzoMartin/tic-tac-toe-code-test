/**
 * Request the creation of a new game room
 * @param {String} symbol
 * @param {Function} callback
 */
const createGame = (symbol, callback) => {
  fetch('/rooms', {
    method: 'POST',
    body: JSON.stringify({ symbol }),
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    credentials: 'same-origin'
  }).then((res) => {
    return res.json();
  }).then((res) => {
    callback(null, res);
  }).catch((err) => {
    callback(err);
  });
};

/**
 * Join the given room as a player
 * @param {String} symbol
 * @param {Function} callback
 */
const joinGame = (symbol, callback) => {
  fetch(window.location.pathname, {
    method: 'POST',
    body: JSON.stringify({ symbol }),
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    credentials: 'same-origin'
  }).then((res) => {
    return res.json();
  }).then((res) => {
    callback(null, res);
  }).catch((err) => {
    callback(err);
  });
};

/**
 * Place player symbol on the given index
 * @param {String} cell
 * @param {Function} callback
 */
const playTurn = (cell, callback) => {
  fetch(window.location.pathname, {
    method: 'PUT',
    body: JSON.stringify({ cell }),
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    credentials: 'same-origin'
  }).then((res) => {
    return res.json();
  }).then((res) => {
    callback(null, res);
  }).catch((err) => {
    callback(err);
  });
};

export default {
  createGame,
  joinGame,
  playTurn
};
