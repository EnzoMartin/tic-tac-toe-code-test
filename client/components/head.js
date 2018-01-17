import React from 'react';

import NextHead from 'next/head';
import { string } from 'prop-types';

const Head = (props) => {
  return (
    <NextHead>
      <meta charSet="UTF-8" />
      <title>{props.title || 'Tic Tac Toe Code Test App'}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link crossOrigin="anonymous" rel="icon" href="/static/favicon.ico" />
      <link crossOrigin="anonymous" rel="stylesheet" type="text/css" href="/static/style.css" media="all"/>
      <link crossOrigin="anonymous" rel="stylesheet" type="text/css" href="/static/rooms.css" media="all"/>
      <script crossOrigin="anonymous" type="text/javascript" src="/static/primus.js"/>
    </NextHead>
  );
};


Head.propTypes = {
  title: string
};

export default Head;
