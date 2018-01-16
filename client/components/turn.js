import React from 'react';
import Player from './player';

const TurnIndicator = ({ playerTurn, playerId, currentPlayer }) => {
  const turnClass = `player-turn ${playerTurn === playerId ? 'current-turn' : ''}`;

  return (
    <div className={turnClass}>
      <Player playerId={playerId} currentPlayer={currentPlayer}/>
      <div className="turn-indicator">Current Turn</div>
    </div>
  );
};

export default TurnIndicator;
