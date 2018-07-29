// test the player score
const p = new Player('Player1');
p.score.increase(100);
p.score.increase(200);
p.score.bankrupt();
p.score.decrease(50);
p.score.increase(1000);

p.score.nextRound();
p.score.decrease(200);
p.score.double();
p.score.increase(50);

console.log(p.score.total);
console.log(((100 + 100) * 0 - 50 + 1000) + (-200 - 200 + 50));

// test board
let b = new Board();
let data = JSON.stringify(data1);
b.import(data);

for(let i=0; i<6; i++){
    for(let j=0; j<5; j++){
        let clue = b.nextClue(i);
        console.log(clue);
    }
}
console.log(b.complete());
