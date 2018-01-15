import React from 'react';

import api from '../lib/api';

const symbols = [
  {
    name: 'Old school X',
    id: 'x-symbol',
    value: 'X',
    defaultChecked: true
  },
  {
    name: 'Old school O',
    id: 'o-symbol',
    value: 'O'
  },
  {
    name: 'The new guy',
    id: '&-symbol',
    value: '&'
  },
  {
    name: 'The champ',
    id: '#-symbol',
    value: '#'
  },
  {
    name: 'The underdog',
    id: '!-symbol',
    value: '!'
  }
];

const Game = ({ join, full }) => {
  let selectedSymbol = symbols.find((item) => { return item.defaultChecked; }).value;

  const upsertGame = (event) => {
    event.preventDefault();

    if (join) {
      api.joinGame(selectedSymbol, (err, res) => {
        if (err) {
          alert('Failed to join room');
        } else if (res.status !== 'success') {
          alert('Room already has maximum players');
        }
      });
    } else {
      api.createGame(selectedSymbol, (err, res) => {
        if (err) {
          alert('Failed to create new room');
        } else {
          window.location.href = `/rooms/${res.roomId}`;
        }
      });
    }
  };

  return (
    <div className="create-game">
      <form name="create-game" onSubmit={upsertGame}>
        <table cellPadding={0} cellSpacing={0} border="0">
          <tbody>
            <tr>
              <td>
                <h3>Select your weapon:</h3>
                <div className="symbol-selection">
                  {symbols.map((symbol) => {
                    const id = symbol.id;
                    return [
                      <input
                        key={`${id}-input`}
                        className="symbol-input"
                        type="radio"
                        id={id}
                        name="symbol"
                        onChange={() => { selectedSymbol = symbol.value; }}
                        defaultChecked={symbol.defaultChecked}
                        defaultValue={symbol.value} />,
                      <label
                        key={`${id}-label`}
                        className="symbol-label"
                        htmlFor={id}
                        title={symbol.name}>
                        {symbol.value}
                      </label>
                    ];
                  })}
                </div>
              </td>
              <td className="create-game-col">
                {full ?
                  <button disabled className="btn disabled">Game Full</button>
                  : <button type="submit" className="btn">{join ? 'Join Game' : 'Start new Game'}</button>
                }
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default Game;
