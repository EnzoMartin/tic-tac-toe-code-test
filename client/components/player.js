import React from 'react';

const Player = ({ children, playerId, showStatus, isOnline, isPlaying, currentPlayer }) => {
  const shortId = playerId.slice(0, 5);
  const name = playerId === currentPlayer ? 'You' : `User ${shortId}`;

  return (
    <span>
      {showStatus ?
        <span className={`user-row ${isOnline ? 'user-online' : ''} ${isPlaying ? 'user-playing' : ''}`}>
          {isOnline ? <em>{name}</em> : <strong>{name}</strong>}
          <i className="dot" />
        </span> : <span className='user-row'>{name}</span>}
      {children}
    </span>
  );
};

export default Player;
