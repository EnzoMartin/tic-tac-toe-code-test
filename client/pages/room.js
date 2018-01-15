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
        p2: ''
      },
      actions: [],
      actionsMap: {}
    },
    users: [],
    playerId: '',
    playerTurn: ''
  };

  state = {
    users: this.props.users, // eslint-disable-line no-invalid-this
    playerId: this.props.playerId, // eslint-disable-line no-invalid-this
    room: this.props.room, // eslint-disable-line no-invalid-this
    isPlaying: this.props.isPlaying, // eslint-disable-line no-invalid-this
    playerTurn: this.props.playerTurn // eslint-disable-line no-invalid-this
  };

  handleOnClick(event) {
    const {x, y } = event.currentTarget.dataset;
    if (this.state.isPlaying) {
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
    const dimensions = this.state.room.info.size.split(',');
    const height = parseInt(dimensions[0], 10);
    const width = parseInt(dimensions[1], 10);

    return (
      <div>
        <Head title={`Room ${this.state.room.id.slice(0, 5)}`} />
        <Nav />

        <div id="rooms" className="page">
          {this.state.isPlaying ? null : [
            <div key="row" className="row">
              <Game join full={this.state.room.info.p2}/>
            </div>,
            <hr key="hr" />
          ]}
          <div className="row">
            <div className="players">
              <h4>Player 1:</h4>
              <span>
                <Player playerId={this.state.room.info.p1} isSelf={this.state.playerId === this.state.room.info.p1}/>
                <TurnIndicator
                  isPlaying={this.state.isPlaying}
                  playerTurn={this.state.playerTurn}
                  playerId={this.state.room.info.p1}
                  isSelf={this.state.room.info.p1 === this.state.playerId}
                />
              </span>
              <h4>Player 2:</h4>
              {this.state.room.info.p2 ?
                <span>
                  <Player playerId={this.state.room.info.p2} isSelf={this.state.playerId === this.state.room.info.p2}/>
                  <TurnIndicator
                    isPlaying={this.state.isPlaying}
                    playerTurn={this.state.playerTurn}
                    playerId={this.state.room.info.p2}
                    isSelf={this.state.room.info.p2 === this.state.playerId}
                  />
                </span>
                : <span>
                  Waiting for opponent...
                </span>
              }
            </div>
            <div>
              <Grid
                isPlaying={this.state.isPlaying}
                playerTurn={this.state.playerTurn}
                height={height}
                width={width}
                playerId={this.state.playerId}
                room={this.state.room.info}
                actions={this.state.room.actionsMap}
                handleOnClick={this.handleOnClick.bind(this)}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
