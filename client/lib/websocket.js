const initialize = () => {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  const socket = new WebSocket(`${protocol}://${window.location.host}/primus`);

  socket.onmessage = (event) => {
    console.log('Got WS data', event);
    console.log('Data', JSON.parse(event.data));
  };

  socket.onopen = () => {
    console.log('Connection is alive');
    socket.send({ event: 'join', to: 'chat' });
  };

  socket.onclose = () => {
    console.log('Lost connection');
    window.setTimeout(() => {
      console.log('Reconnection attempt');
      initialize();
    }, 5000);
  };
};

export default initialize;
