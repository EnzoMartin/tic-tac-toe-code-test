import React, { Component } from 'react';

import initialize from '../lib/websocket';
import api from '../lib/api';

import Head from '../components/head';
import Nav from '../components/nav';

import Game from '../components/game';

import Player from '../components/player';
import Grid from '../components/grid';
import TurnIndicator from '../components/turn';

export default class extends Component {
  static getInitialProps({ query }) {
    const data = { room: query.data, playerId: query.playerId };
    const lastAction = data.room.actions.pop() || { value: data.room.info.p2 }; // Player 1 should always go first

    data.canPlay = data.room.info.p1 && data.room.info.p2 && !data.room.info.winner;
    data.isPlaying = data.room.info.p1 === data.playerId || data.room.info.p2 === data.playerId;
    data.playerTurn = lastAction.value === data.room.info.p2 ? data.room.info.p1 : data.room.info.p2;

    return data;
  }

  componentDidMount() {
    this.socket = initialize();

    this.socket.on('open', () => {
      this.socket.write({ type: 'join', id: this.state.room.id});
    });

    this.socket.on('data', (event) => {
      if (event.type === 'rooms') {
        this.setState((state) => {
          const room = event.data.find((item) => {
            return item.id === state.room.id;
          }) || state.room;

          const isPlaying = room.info.p1 === state.playerId || room.info.p2 === state.playerId;
          const lastAction = room.actions.pop() || {};

          return {
            room,
            canPlay: room.info.p1 && room.info.p2 && !room.info.winner,
            isPlaying,
            playerTurn: lastAction.value === state.room.info.p2 ? state.room.info.p1 : state.room.info.p2
          };
        });
      } else if (event.type === 'actions') {
        this.setState((state) => {
          const room = event.data || state.room;
          const lastAction = room.actions.pop() || {};

          return {
            room,
            canPlay: room.info.p1 && room.info.p2 && !room.info.winner,
            playerTurn: lastAction.value === state.room.info.p2 ? state.room.info.p1 : state.room.info.p2
          };
        });
      }
    });
  }

  static defaultProps = {
    room: {
      id: '',
      info: {
        size: '3,3',
        p1: '',
        p2: '',
        winningSequence: []
      },
      actions: [],
      actionsObj: {}
    },
    users: [],
    playerId: '',
    playerTurn: ''
  };

  state = {
    canPlay: this.props.canPlay, // eslint-disable-line no-invalid-this
    users: this.props.users, // eslint-disable-line no-invalid-this
    playerId: this.props.playerId, // eslint-disable-line no-invalid-this
    room: this.props.room, // eslint-disable-line no-invalid-this
    isPlaying: this.props.isPlaying, // eslint-disable-line no-invalid-this
    playerTurn: this.props.playerTurn // eslint-disable-line no-invalid-this
  };

  handleOnClick(event) {
    const {x, y } = event.currentTarget.dataset;
    if (this.state.canPlay && this.state.isPlaying) {
      if (this.state.playerTurn === this.state.playerId) {
        api.playTurn(`${x},${y}`, (err, result) => {
          if (err) {
            alert('Failed to play selected move');
          } else if (result.status === 'failed') {
            alert('Cell is already occupied');
          }
        });
      } else {
        alert('Opponent is playing, please wait');
      }
    }
  }

  handleOnJoin(symbol) {

  }

  render() {
    const { winningSequence, winner, size, p1, p2 } = this.state.room.info;
    const dimensions = size.split(',');
    const height = parseInt(dimensions[0], 10);
    const width = parseInt(dimensions[1], 10);
    const winningText = winner === this.state.playerId ? 'You won!' : 'You lost!';
    const roomTitle = `Room ${this.state.room.id.slice(0, 5)}`;

    return (
      <div>
        <Head title={roomTitle} />
        <Nav />

        <div id="rooms" className="page">
          {this.state.isPlaying || p1 && p2 ? null : [
            <div key="row" className="row">
              <Game join full={p2}/>
            </div>,
            <hr key="hr" />
          ]}
          <div className="row">
            <div className="players">
              <div className="room-title">{roomTitle}</div>
              <div className="player one">
                <TurnIndicator
                  playerTurn={this.state.canPlay ? this.state.playerTurn : ''}
                  playerId={p1}
                  currentPlayer={this.state.playerId}
                />
              </div>
              <div id="versus">
                - VS -
              </div>
              <div className="player two">
                {p2 ?
                  <TurnIndicator
                    playerTurn={this.state.canPlay ? this.state.playerTurn : ''}
                    playerId={p2}
                    currentPlayer={this.state.playerId}
                  />
                  : <span>Waiting for player</span>
                }
              </div>
            </div>
            <div id="grid-container">
              {!this.state.canPlay ?
                <div id="grid-overlay">
                  <div id="grid-overlay-content">
                    {winner && winner !== 'draw' ?
                      <span>
                        {this.state.isPlaying ? winningText : <Player playerId={winner} currentPlayer={this.state.playerId}> has won!</Player>}
                      </span> : null}
                    {winner === 'draw' ? <span>Draw!</span> : null}
                    {!winner ? <span>Waiting for player</span> : null}
                  </div>
                </div> : null
              }
              <Grid
                isPlaying={this.state.isPlaying}
                playerTurn={this.state.canPlay ? this.state.playerTurn : null}
                p1={p1}
                height={height}
                width={width}
                winningSequence={winningSequence}
                playerId={this.state.playerId}
                room={this.state.room.info}
                actions={this.state.room.actionsObj}
                handleOnClick={this.handleOnClick.bind(this)}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
