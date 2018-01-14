const initialize = () => {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  const url = `${protocol}://${window.location.host}/primus`;
  const socket = new Primus(url);

  socket.on('data', (data) => {
    console.log('Got WS data', data);
  });

  socket.on('open', () => {
    console.log('Connection is alive');
    socket.write('I lives');
  });

  socket.on('reconnected', () => {
    console.log('Socket reconnected');
  });

  socket.on('end', (event) => {
    console.log('Lost connection with code', event.code);
  });
};

export default initialize;
