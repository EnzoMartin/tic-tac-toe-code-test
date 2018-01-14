import React from 'react';

import NextHead from 'next/head';
import { string } from 'prop-types';

const defaultDescription = '';
const defaultOGURL = '';
const defaultOGImage = '';

const Head = (props) => {
  return (
    <NextHead>
      <meta charSet="UTF-8" />
      <title>{props.title || ''}</title>
      <meta
        name="description"
        content={props.description || defaultDescription}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link crossOrigin="anonymous" rel="icon" sizes="192x192" href="/static/touch-icon.png" />
      <link crossOrigin="anonymous" rel="apple-touch-icon" href="/static/touch-icon.png" />
      <link crossOrigin="anonymous" rel="mask-icon" href="/static/favicon-mask.svg" color="#49B882" />
      <link crossOrigin="anonymous" rel="icon" href="/static/favicon.ico" />
      <meta property="og:url" content={props.url || defaultOGURL} />
      <meta property="og:title" content={props.title || ''} />
      <meta
        property="og:description"
        content={props.description || defaultDescription}
      />
      <meta name="twitter:site" content={props.url || defaultOGURL} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={props.ogImage || defaultOGImage} />
      <meta property="og:image" content={props.ogImage || defaultOGImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <link crossOrigin="anonymous" rel="stylesheet" type="text/css" href="/static/style.css" media="all"/>
      <link crossOrigin="anonymous" rel="stylesheet" type="text/css" href="/static/rooms.css" media="all"/>
      <style>
          @import url('https://fonts.googleapis.com/css?family=Roboto');
      </style>
      <script crossOrigin="anonymous" type="text/javascript" src="/static/primus.js"/>
    </NextHead>
  );
};


Head.propTypes = {
  title: string,
  description: string,
  url: string,
  ogImage: string
};

export default Head;
