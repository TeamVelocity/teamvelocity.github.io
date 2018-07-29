// // test the player score
// const p = new Player('Player1');
// p.score.increase(100);
// p.score.increase(200);
// p.score.bankrupt();
// p.score.decrease(50);
// p.score.increase(1000);

// p.score.nextRound();
// p.score.decrease(200);
// p.score.double();
// p.score.increase(50);

// console.log(p.score.total);
// console.log(((100 + 100) * 0 - 50 + 1000) + (-200 - 200 + 50));

let assert = require('assert');
let sample_data = require('../scripts/data.js');
let logic = require('../scripts/game.js');

let game = new logic.Game();

let data = [sample_data.data1, sample_data.data2];
for(let i=0; i<data.length; i++){
    let round = game.addRound();

    round.board.import(JSON.stringify(data[i]));
    round.wheel.assignSectors();
    round.wheel.randomizeSectors();    
}

round = game.getRound(0);
let clue = round.board.getCategory(1).clues[2];
clue.question = "What is the oldest soft drink in America?";
clue.answer = "Dr. Pepper.";

game.addPlayer("Ben");

round = game.getRound(0);
round.start();

console.log(round.currentPlayer);
let spin = round.wheel.spin();
console.log(spin);



describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal([1,2,3].indexOf(4), -1);
    });
  });
});