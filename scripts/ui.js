"use strict"
/**
 * @fileOverview UI setup and interaction.
 */

// globals
let game;
let round;

$(document).ready(function(){
    // hide setup view
    $(".setup").hide();

    game = new Game();

    // create default boards
    let data = [data1, data2];

    for(let i=0; i<data.length; i++){
        let round = game.addRound();

        round.board.import(JSON.stringify(data[i]));
        round.wheel.assignSectors();
        round.wheel.randomizeSectors();    
    }

    // edit board content if needed
    round = game.getRound(0);
    let clue = round.board.getCategory(1).clues[2];
    clue.question = "What is the oldest soft drink in America?";
    clue.answer = "Dr. Pepper.";


    // start game
    $("#btn-play").click(function(){
        // store players -- should be adjusted for num of players and default names
        let playerName = $("#player0").find("input").val();
        game.addPlayer(playerName);
    })

    // start first round
    round = game.getRound(0);
    round.start();

    // player spins
    console.log(round.currentPlayer);
    let spin = round.wheel.spin();

    // animate the wheel

    // display outcome
    console.log(spin);

    // address outcome

    // check if round is over
    if(round.complete){
        // end round
    }
  });
