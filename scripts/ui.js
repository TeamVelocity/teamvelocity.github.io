"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let game;
let round;
let playerCount = 3;

function download(filename, text) {
    // source: https://goo.gl/VWW2sT
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

class Alert{
    static success (msg){
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-success");
        a.find("#alert-text").empty().text(msg);
        a.show();
    };
    
    static danger (msg){
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-danger");
        a.find("#alert-text").empty().html(msg);
        a.show();
    };
    
    static warning (msg){
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-warning");
        a.find("#alert-text").empty().html(msg);
        a.show();
    };
    
    static hide (ms){
        // set milliseconds to delay hide
        if(ms){
            setTimeout(function(){$("#alert").hide("slow")}, ms);
        } else {
            $("#alert").hide();
        }
    };
}

function startEdit(){
    $(".start-panel").hide();
    $(".edit-panel").show();
}

function endEdit(){
    $(".edit-panel").hide();
    $(".start-panel").show();
}

function startGame(){
    $(".start-panel").hide();
    $(".play-panel").show();

    for(let i=0; i<playerCount; i++){
        $("#player" + i + " input").prop("readonly", true);
    }
}

function removePlayer(){
    if(playerCount > 1){
        playerCount--;
        $("#player" + playerCount).hide();
    } else {
        Alert.danger('Minimum of one player supported');
        Alert.hide(2000);
    }
}

function addPlayer(){
    if(playerCount < 3){
        $("#player" + playerCount).show();
        playerCount++;
    } else {
        Alert.danger('Maximum of three players supported');
        Alert.hide(2000);
    }
}

$(document).ready(function(){
    // hide panels
    $(".edit-panel").hide();
    $(".play-panel").hide();

    // setup click handlers
    $("#alert button").click(function(){$("#alert").hide();});

    $("#btn-start-edit").click(function(){
        startEdit();
    });

    $("#btn-stop-edit").click(function(){
        endEdit();
    });

    $("#btn-play").click(function(){
        startGame();
    });

    $("#btn-export").click(function(){
        // should make this more robust
        let roundID = $("#select-round").val() - 1;
        let round = game.getRound(roundID)
        download('board.json', round.board.export());
    });

    $("#btn-add-player").click(function(){
        addPlayer();
        console.log(playerCount)
    });

    $("#btn-del-player").click(function(){
        removePlayer();
        console.log(playerCount)        
    });

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
