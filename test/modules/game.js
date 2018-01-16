const expect = require('expect');

const game = require('../../service/modules/game');

const infoMock = {
  winCondition: '3'
};

const winningMocks = {
  diagonal: {
    asArray: [
      { key: '0,0', value: 'me'},
      { key: '0,1', value: 'you'},
      { key: '1,1', value: 'me'},
      { key: '0,2', value: 'you'},
      { key: '2,2', value: 'me'}
    ]
  },
  row: {
    asArray: [
      { key: '0,0', value: 'me'},
      { key: '0,1', value: 'you'},
      { key: '0,1', value: 'me'},
      { key: '0,2', value: 'you'},
      { key: '0,2', value: 'me'}
    ]
  },
  column: {
    asArray: [
      { key: '0,2', value: 'me'},
      { key: '0,0', value: 'you'},
      { key: '1,2', value: 'me'},
      { key: '1,1', value: 'you'},
      { key: '2,2', value: 'me'}
    ]
  }
};

const losingMocks = {
  one: {
    asArray: [
      {key: '0,1', value: 'me'},
      {key: '1,1', value: 'you'},
      {key: '0,0', value: 'me'},
      {key: '0,2', value: 'you'},
      {key: '1,2', value: 'me'}
    ]
  }
};


Object.keys(winningMocks).forEach((mock) => {
  winningMocks[mock].asObject = winningMocks[mock].asArray.reduce((items, item) => {
    items[item.key] = item.value;
    return items;
  }, {});
});

Object.keys(losingMocks).forEach((mock) => {
  losingMocks[mock].asObject = losingMocks[mock].asArray.reduce((items, item) => {
    items[item.key] = item.value;
    return items;
  }, {});
});

describe('game module', () => {
  it('exposes the module methods', () => {
    expect(typeof game.checkWinner).toBe('function');
    expect(typeof game.checkDraw).toBe('function');
  });

  describe('checkWinner method', () => {
    it('returns the winning row and player if it finds matching winning condition', () => {
      expect(game.checkWinner(winningMocks.diagonal, infoMock)).toEqual({ playerId: 'me', sequence: ['2,2','1,1','0,0'] });
      expect(game.checkWinner(winningMocks.row, infoMock)).toEqual({ playerId: 'me', sequence: ['0,2','0,1','0,0'] });
      expect(game.checkWinner(winningMocks.column, infoMock)).toEqual({ playerId: 'me', sequence: ['2,2','1,2','0,2'] });
    });

    it('returns null if it cannot find a matching winning condition', () => {
      expect(game.checkWinner(losingMocks.one, infoMock)).toEqual(null);
    });
  });

  describe('checkDraw method', () => {
    it('returns true if the amount of actions is equal or larger than the possible moves', () => {
      expect(game.checkDraw({ asArray: new Array(9).fill(1) }, {size: '3,3'})).toBe(true);
      expect(game.checkDraw({ asArray: new Array(11).fill(1) }, {size: '3,3'})).toBe(true);
      expect(game.checkDraw({ asArray: new Array(50).fill(1) }, {size: '5,5'})).toBe(true);
    });

    it('returns false if the amount of actions is less than the possible moves', () => {
      expect(game.checkDraw({ asArray: new Array(5).fill(1) }, {size: '3,3'})).toBe(false);
      expect(game.checkDraw({ asArray: new Array(1).fill(1) }, {size: '3,3'})).toBe(false);
    });
  });
});
