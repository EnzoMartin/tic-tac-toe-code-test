import React from 'react';

const RoomRow = ({ room, playerId }) => {
  const isPlaying = room.info.p1 === playerId || room.info.p2 === playerId;
  const isDone = room.info.winner;
  const isDraw = room.info.winner === 'draw';
  const hasWon = room.info.winner === playerId;

  let status;
  let buttonText = 'Join';

  if (isPlaying) {
    status = 'Playing';

    if (isDone) {
      buttonText = 'View';
      if (hasWon) {
        status = 'Won';
      } else if (isDraw) {
        status = 'Draw';
      } else {
        status = 'Lost';
      }
    } else {
      buttonText = 'Play';
    }
  } else {
    if (isDone) {
      status = 'Over';
      buttonText = 'View';
    } else if (room.info.p1 && room.info.p2) {
      status = 'Full';
    } else {
      status = 'Waiting';
    }
  }

  const className = status.toLowerCase();

  return (
    <tr className={`room-row ${className} ${isDone ? 'over' : ''}`}>
      <td>Room {room.id.slice(0, 5)}</td>
      <td className="status align-center">
        <span>{status}</span>
      </td>
      <td className="join-btn align-right">
        <a className="btn" href={`/rooms/${room.id}`}>{buttonText}</a>
      </td>
    </tr>
  );
};

export default RoomRow;
