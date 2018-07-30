let assert = require('assert');
let sample_data = require('../scripts/data.js');
let engine = require('../scripts/engine.js');

/** @test {Game} */
describe('Game', function(){
  let game;
  let name;
  
  before(function() {
    game = new engine.Game();
  });

  /** @test {Game#addPlayer} */
  describe('#addPlayer', function(){
    it('should set player name', function(){
      let name = "john";
      game.addPlayer(name);
      assert.equal(game.players[0].name, name)
    });
  });

  describe('#getPlayer', function(){      
    it('should get player', function(){
      let player = game.getPlayer(0);
      assert(player instanceof engine.Player)
    });
  });

  describe('#editPlayer', function(){      
    it('should edit player', function(){
      let name = "jane";
      game.editPlayer(0, name);
      let player = game.getPlayer(0);
      assert.equal(player.name, name)
    });
  });

  describe('#addRound', function(){
    it('should add round', function(){
      let round = game.addRound();
      assert(round instanceof engine.Round)
    });
  });

  describe('#getRound', function(){
    it('should get round', function(){
      let round = game.getRound(0);
      assert(round instanceof engine.Round)
    });
  });
});

describe('Score', function(){
  let score;

  before(function(){
    score = new engine.Score();
  })

  describe('#increase', function(){
    it('should be 10', function(){
      score.increase(10);
      assert.equal(score.points, 10);
    })

    it('should be 20', function(){
      score.increase(10);
      assert.equal(score.points, 20);
    })
  })

  describe('#decrease', function(){
    it('should be 15', function(){
      score.decrease(5);
      assert.equal(score.points, 15);
    })
  })

  describe('#bankrupt', function(){
    it('should be 0', function(){
      score.bankrupt();
      assert.equal(score.points, 0);
    })

    it('should be -10', function(){
      score.decrease(-10)
      score.bankrupt();
      assert.equal(score.points, -10);
    })
  })

  describe('#double', function(){
    it('should be -20', function(){
      score.double();
      assert.equal(score.points, -20);
    })
    it('should be 10', function(){
      score.reset();
      score.increase(5);
      score.double();
      assert.equal(score.points, 10);
    })
  })
})
