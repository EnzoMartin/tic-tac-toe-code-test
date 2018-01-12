import React, { Component } from 'react';

import Head from '../components/head';
import Nav from '../components/nav';

export default class extends Component {
  static getInitialProps({ query, req }) {
    const { error } = req && req.query || {};
    return { rooms: query, error };
  }

  render() {
    return (
      <div>
        <Head title="Game Rooms" />
        <Nav />

        <div id="rooms">
          <div className="row">
            <h1 className="title">Game Rooms</h1>
          </div>
          <div className="row">
            Create new room
          </div>
          <hr />
          <div className="row">
            <table width="100%" cellPadding="0" cellSpacing="0" border="0">
              <tbody>
                {this.props.rooms.map((item) => {
                  return (
                    <tr>
                      <td>I am room!</td>
                    </tr>
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
