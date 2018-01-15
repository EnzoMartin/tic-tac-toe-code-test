import React from 'react';

const Player = ({ playerId, isOnline, isPlaying, isSelf }) => {
  const shortId = playerId.slice(0, 5);
  const name = isSelf ? 'You' : `User ${shortId}`;

  return (
    <span className={`user-row ${isOnline ? 'user-online' : ''} ${isPlaying ? 'user-playing' : ''}`}>
      {isOnline ? <em>{name}</em> : <strong>{name}</strong>}
      <i className="dot" />
    </span>
  );
};

export default Player;
