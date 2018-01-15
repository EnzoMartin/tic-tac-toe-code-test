const initialize = () => {
  const protocol = window.location.protocol === 'http:' ? 'ws' : 'wss';
  const url = `${protocol}://${window.location.host}/primus`;
  return new Primus(url);
};

export default initialize;
