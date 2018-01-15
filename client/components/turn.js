import React from 'react';

const TurnIndicator = ({ isPlaying, playerTurn, playerId, isSelf }) => {
  let text = null;

  if (isPlaying) {
    if (playerTurn === playerId) {
      if (isSelf) {
        text = 'Your turn!';
      } else {
        text = 'Opponent turn';
      }
    }
  } else {
    if (playerTurn === playerId) {
      text = 'Current turn';
    }
  }

  return <span className="player-turn">{text}</span>;
};

export default TurnIndicator;
