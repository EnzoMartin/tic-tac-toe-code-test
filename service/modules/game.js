const validDirections = [
  {x: 0, y: -1},
  {x: 0, y: 1},

  {x: 1, y: 1},
  {x: 1, y: -1},

  {x: -1, y: 1},
  {x: -1, y: -1},

  {x: 1, y: 0},
  {x: -1, y: 0}
];

/**
 * Find and return a winning row array of coordinates, otherwise returns null | O(n^2) complexity
 * @param {String} start
 * @param {String} playerId
 * @param {Object} actions
 * @param {Number} winCondition
 * @returns {Object}
 */
const findWinningRowAndPlayer = (start, playerId, actions, winCondition) => {
  let winner = null;
  const starting = start.split(',');
  const initialCoordinates = {
    x: parseInt(starting[0], 10),
    y: parseInt(starting[1], 10)
  };

  // Loop over each possible direction we might find a cell with a symbol
  for (let d = 0; d < validDirections.length; d++) {
    const direction = validDirections[d];
    const sequence = [start];


    let coordinateObj = {
      x: initialCoordinates.x,
      y: initialCoordinates.y
    };

    for (let depth = 1; depth < winCondition; depth++) {
      coordinateObj = {
        x: coordinateObj.x + direction.x,
        y: coordinateObj.y + direction.y
      };

      const coordinate = `${coordinateObj.x},${coordinateObj.y}`;
      const action = actions[coordinate];
      if (action === playerId) {
        sequence.push(coordinate); // Found a matching symbol
      } else {
        // Bail out of direction loop if not suitable cell found
        break;
      }
    }

    if (sequence.length === winCondition) {
      // Found winning sequence, bail out of loop
      winner = {
        playerId,
        sequence
      };
      break;
    }
  }

  return winner;
};

/**
 * Find if the last move has won the game in the given room
 * @param {Object} actions
 * @param {Object} info
 * @returns {Object}
 */
const checkWinner = (actions, info) => {
  let winner = null;
  const actionsLen = actions.asArray.length;

  if (actionsLen) {
    const lastPlayed = actions.asArray[actionsLen - 1];
    const winCondition = parseInt(info.winCondition, 10);

    const start = lastPlayed.key;
    const playerId = lastPlayed.value;

    winner = findWinningRowAndPlayer(start, playerId, actions.asObject, winCondition);
  }

  return winner;
};

/**
 * Checks whether the game has finished in a draw
 * @param {Object} actions
 * @param {Object} info
 * @returns {Boolean}
 */
const checkDraw = (actions, info) => {
  const size = info.size.split(',');
  return actions.asArray.length >= size[0] * size[1];
};

module.exports = {
  checkWinner,
  checkDraw
};
