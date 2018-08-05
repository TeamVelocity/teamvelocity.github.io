"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let game;
let round;

$(document).ready(function(){
    // hide setup view
    $(".setup").hide();

    // init default game
    game = initDefaultGame();

    // edit board content if needed
    round = game.getRound(0);
    let clue = round.board.getCategory(1).clues[2];
    clue.question = "What is the oldest soft drink in America?";
    clue.answer = "Dr. Pepper.";

    // setup players
    // $("#btn-play").click(function(){
    //     // store players -- should be adjusted for num of players and default names
    //     let playerName = $("#player0").find("input").val();
    //     game.addPlayer(playerName);
    // })

    // add sample players for testing
    game.addPlayer("John");
    game.addPlayer("Jane");

    // start first round
    round = game.getRound(0);
    round.start();

    if(game.complete){
        // end game
    } else if (round.complete){
        // end round
    } else {
        // prepare UI for first spin

        // spin wheel
        //let spin = round.spin();

        // animate UI

        // respond to outcome

        // if category and not spin again, display the clue
        //clue = spin.clue;

        // if player or opponents choice
        // let categoryColumn = 0;
        // let clue = round.pickCategory(categoryColumn);

        // if answer is valid
        // round.validAnswer();
        
        // if answer is invalid
        // round.invalidAnswer()

        // if lose turn or wrong answer and player has a token
        // give option to use token
        // if (round.stats.currentPlayer.hasToken){
        //     round.useToken();
        //     // start over at spin
        // } else {
        //     // do not allow token use
        // }


        // update players score and tokens

        // reset for next spin
        // round.endTurn();
    }
  });
