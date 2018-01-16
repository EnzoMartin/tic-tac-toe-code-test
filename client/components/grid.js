import React from 'react';

const Grid = ({ p1, isPlaying, playerTurn, height, width, room, playerId, actions, winningSequence, handleOnClick }) => {
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
                  const isWinningCell = winningSequence.indexOf(index) !== -1;
                  const ownership = filledByPlayer === p1 ? 'player1' : 'player2';
                  const hoverClass = playerId === p1 ? 'hover-player1' : 'hover-player2';

                  return (
                    <div
                      key={`row-${x}-col-${y}`}
                      className={`grid-col ${ownership} ${filledByPlayer ? 'occupied' : ''} ${isWinningCell ? 'winning' : ''} ${hoverClass}`}
                      data-x={x}
                      data-y={y}
                      onClick={handleOnClick}>
                      {filledByPlayer ? <span>{room[filledByPlayer]}</span> : <span className={'self ghost'}>{room[playerId]}</span>}
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
