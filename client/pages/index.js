import React, { Component } from 'react';

import initialize from '../lib/websocket';

import Head from '../components/head';
import Nav from '../components/nav';
import Game from '../components/game';
import RoomRow from '../components/room-row';

export default class Rooms extends Component {
  static getInitialProps({ query }) {
    Rooms.sortRooms(query.data);
    return { rooms: query.data, playerId: query.playerId };
  }

  static sortRooms(rooms) {
    rooms.sort((a, b) => {
      return new Date(b.info.created) - new Date(a.info.created);
    });

  }

  componentDidMount() {
    const socket = initialize();
    socket.on('data', (event) => {
      if (event.type === 'rooms') {
        Rooms.sortRooms(event.data);
        this.setState({ rooms: event.data });
      }
    });
  }

  static defaultProps = {
    rooms: [],
    playerId: ''
  };

  state = {
    playerId: this.props.playerId, // eslint-disable-line no-invalid-this
    rooms: this.props.rooms // eslint-disable-line no-invalid-this
  };

  render() {
    return (
      <div>
        <Head title="Game Rooms" />
        <Nav />

        <div id="rooms" className="page">
          <div className="row">
            <Game/>
          </div>
          <hr />
          <div className="row">
            <table id="lobby" width="100%" cellPadding="0" cellSpacing="0" border="0">
              <thead>
                <tr>
                  <th colSpan="3">
                    <h4>Available rooms:</h4>
                  </th>
                </tr>
              </thead>
              <tbody>
                {this.state.rooms.map((item) => {
                  return (
                    <RoomRow key={item.id} playerId={this.props.playerId} room={item}/>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}
