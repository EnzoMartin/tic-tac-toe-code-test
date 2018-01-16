const initialize = () => {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  const url = `${protocol}://${window.location.host}/primus`;
  const socket = new Primus(url);

  socket.on('reconnected', () => {
    socket.write({ type: 'rooms' });
  });

  return socket;
};

export default initialize;
