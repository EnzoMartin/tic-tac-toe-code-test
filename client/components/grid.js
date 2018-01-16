import React from 'react';

const Grid = ({ isPlaying, playerTurn, height, width, room, playerId, actions, winningSequence, handleOnClick }) => {
  return (
    <div id="game-grid" className={`${playerTurn === playerId && isPlaying ? 'playing' : ''}`}>
      {
        Array(height).fill(1).map((i, x) => {
          return (
            <div key={`row-${x}`} className="grid-row" data-x={x}>
              {
                Array(width).fill(1).map((i, y) => {
                  const index = `${x},${y}`;
                  const filledByPlayer = actions[index];
                  const isSelf = isPlaying ? filledByPlayer === playerId : filledByPlayer === room.p1;
                  const isWinningCell = winningSequence.indexOf(index) !== -1;

                  return (
                    <div
                      key={`row-${x}-col-${y}`}
                      className={`grid-col ${isSelf ? 'self' : ''} ${filledByPlayer ? 'occupied' : ''} ${isWinningCell ? 'winning' : ''}`}
                      data-x={x}
                      data-y={y}
                      onClick={handleOnClick}>
                      <span>
                        {filledByPlayer ? room[filledByPlayer] : null}
                      </span>
                    </div>
                  );
                })
              }
            </div>
          );
        })
      }
    </div>
  );
};

export default Grid;
