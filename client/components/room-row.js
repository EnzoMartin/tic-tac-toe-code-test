import React from 'react';

const RoomRow = ({ room, playerId }) => {
  const isPlaying = room.info.p1 === playerId || room.info.p2 === playerId;

  return (
    <tr>
      <td>Room {room.id.slice(0, 5)}</td>
      <td className="align-right">{isPlaying ? 'Playing' : ''}</td>
      <td className="align-right">
        <a className="btn" href={`/rooms/${room.id}`}>{isPlaying ? 'Play' : 'Join'}</a>
      </td>
    </tr>
  );
};

export default RoomRow;
