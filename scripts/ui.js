"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let game;
let round;
let playerCount = 3;

let category_editable = false;
let trivia_editable = false;

// keep track of some elements of the table that have been manipulated by the user
let fill_value = "";
let clicked_col;
let clicked_row;
let clicked_element;

let category_form;
let trivia_form;
let category_dialog;
let trivia_dialog;
let frm_name_category = $('input[name="frm_name_category"]');
let frm_name_trivia_question = $('input[name="frm_name_trivia_question"]');
let frm_name_trivia_answer = $('input[name="frm_name_trivia_answer"]');
let tips = $( ".validateTips" );

// set up the edit category dialog
category_dialog = $( "#category-form" ).dialog( {
    autoOpen: false,
    height: 400,
    width: 350,
    modal: true,
    buttons: {
        "Edit Category": editCategory,
        Cancel: function() { 
            category_dialog.dialog( "close" );
        }
    },
    close: function() { frm_name_category.removeClass( "ui-state-error" ); }
});

// setup the edit trivia dialog
trivia_dialog = $( "#trivia-form" ).dialog( {
    autoOpen: false,
    height: 400,
    width: 350,
    modal: true,
    buttons: {
        "Edit Trivia": editTrivia,
        Cancel: function() { 
            trivia_dialog.dialog( "close" );
        }
    },
    close: function() { 
        frm_name_trivia_question.removeClass( "ui-state-error" );
        frm_name_trivia_answer.removeClass( "ui-state-error" );
    }
});

// set up the form to edit the category text
category_form = category_dialog.find( "form" ).on( "submit", function( submit_event ) {
    submit_event.preventDefault();
    frm_name_category.val("");
});

// set up the form to edit the trivia text
trivia_form = trivia_dialog.find( "form" ).on( "submit", function( submit_event ) {
    submit_event.preventDefault();
});

// function used to update the trivia modal dialog
function populateTriviaFromEngine(clicked_col, clicked_row) {
    
    let roundID = 0;
    let round;

    // the update given -1 will read from the UI widget -- e.g. editing mode
    if (gameRound == -1) {
        // get the round chosen from the round drop down box
        roundID = $("#select-round").val() - 1;
        round = game.getRound(roundID);
    }

    round = game.getRound(gameRound);
    // fetch the clue from the engine
    cell_content = round.board.getClue(clicked_col, clicked_row);

}

function initGameBoardFromRound(roundChoice) {

    console.log("Board redraw - round: " + roundChoice);
    let edit_round = game.getRound(roundChoice);   
    
    // setup the points (cells) for the game as chosen in the drop down box
    $("#triviaTable tbody tr").each(function (row_index, row) {
        let current_row = $(row);
        let cols = 6;
        let column_index = 0;
        let current_clue;
        // iterate through the table, adjusting the points to those associated
        // with the chosen board's point value
        for (column_index = 0; column_index < cols; column_index++) {
            let current_column = current_row[0].cells[column_index];
            //console.log("Column Index: " + column_index + ", column text: " + current_column.innerHTML);
            current_clue = edit_round.board.getClue(column_index, row_index);
            current_column.innerHTML = current_clue.points;
        }
    });

    // setup the categories
    let current_categories = edit_round.board.categoryNames;
    $("#triviaTable thead th").each(function (category_index, category) {
        let current_category_cell = $(category);
        //console.log("category Index: " + category_index);
        //console.log("category name: " + current_categories[category_index]);
        //console.log($(category));
        $(category)[0].innerHTML = current_categories[category_index];
    });
}

function initGameBoard() {

    // setup the game board assuming round 0
    initGameBoardFromRound(0);
}

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

class Alert {
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

function startEdit() {
    $(".start-panel").hide();
    $(".edit-panel").show();

    toggleCategoryClicks();
    toggleTriviaClicks();

    // set the game board to the first round before starting edits
    initGameBoardFromRound(0);
    $('select>option:eq(0)').prop('selected', true);
}

function endEdit() {
    $(".edit-panel").hide();
    $(".start-panel").show();

    toggleCategoryClicks();
    toggleTriviaClicks();

    // set the game board to the first round after edits
    initGameBoardFromRound(0);
}

function startGame() {
    $(".start-panel").hide();
    $(".play-panel").show();

    for(let i=0; i<playerCount; i++){
        $("#player" + i + " input").prop("readonly", true);
    }
}

function removePlayer() {
    if(playerCount > 1){
        playerCount--;
        $("#player" + playerCount).hide();
    } else {
        Alert.danger('Minimum of one player supported');
        Alert.hide(2000);
    }
}

function addPlayer() {
    if(playerCount < 3){
        $("#player" + playerCount).show();
        playerCount++;
    } else {
        Alert.danger('Maximum of three players supported');
        Alert.hide(2000);
    }
}

function toggleClicks() {
    toggleCategoryClicks();
    toggleTriviaClicks();
}

function toggleCategoryClicks() {
    if ( category_editable ){ category_editable = false; }
    else { category_editable = true; }
}

function toggleTriviaClicks() {
    if ( trivia_editable ){ trivia_editable = false; }
    else { trivia_editable = true; }
}

function editCategory() {
    let valid = true;
    frm_name_category.removeClass( "ui-state-error" );
    valid = valid && checkLength( frm_name_category, "category", 3, 32 );
    valid = valid && checkRegexp( frm_name_category, /^[a-z]([0-9a-z_\s])+$/i, "Input may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );

    // validates the form's input field, and closes the modal
    if ( valid ) {
        let category_updated = frm_name_category.val();
        clicked_element.target.innerHTML = category_updated;
        console.log("Input: Category Update: " + category_updated);
        round.board.editCategory(clicked_col, category_updated);
        category_dialog.dialog( "close" );
    }
    return valid;
}

function editTrivia() {
    let valid = true;
    frm_name_trivia_question.removeClass( "ui-state-error" );
    frm_name_trivia_answer.removeClass( "ui-state-error" );

    valid = valid && checkLength( frm_name_trivia_question, "trivia", 3, 256 );
    valid = valid && checkRegexp( frm_name_trivia_question, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");
    valid = valid && checkLength( frm_name_trivia_answer, "trivia", 3, 256 );
    valid = valid && checkRegexp( frm_name_trivia_answer, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");
    
    // validates the form's input field, and closes the modal
    if ( valid ) {
        // store the user's trivia information in the local session table
        let question = frm_name_trivia_question.val();
        let answer = frm_name_trivia_answer.val();
        console.log("Input: \nQuestion: " + question + "\nAnswer: " + answer);
        round.board.editClue(clicked_col, clicked_row, question, answer);

        trivia_dialog.dialog( "close" );
    }
    return valid;
}

function updateTips( t ) {
    tips
        .text( t )
        .addClass( "ui-state-highlight" );
    setTimeout(function() {
        tips.removeClass( "ui-state-highlight", 3000 );
    }, 1500 );
}

function checkLength( o, n, min, max ) {
    if ( o.val().length > max || o.val().length < min ) {
        o.addClass( "ui-state-error" );
        updateTips( "Length of " + n + " must be between " + min + " and " + max + "." );
        return false;
    } else {
        return true;
    }
}

function checkRegexp( o, regexp, n ) {
    if ( !( regexp.test( o.val() ) ) ) {
        o.addClass( "ui-state-error" );
        updateTips( n );
        return false;
    } else { return true; }
}

$(document).ready(function() {
    // hide panels
    $(".edit-panel").hide();
    $(".play-panel").hide();

    // setup click handlers
    $("#alert button").click(function() { $("#alert").hide(); });

    $("#btn-start-edit").click(function() {
        startEdit();
    });

    $("#btn-stop-edit").click(function() {
        endEdit();
    });

    $("#btn-play").click(function() {
        startGame();
    });

    $("#btn-export").click(function() {
        // should make this more robust
        let roundID = $("#select-round").val() - 1;
        let round = game.getRound(roundID)
        download('board.json', round.board.export());
    });

    $("#btn-add-player").click(function() {
        addPlayer();
        console.log(playerCount)
    });

    $("#btn-del-player").click(function() {
        removePlayer();
        console.log(playerCount)        
    });

    // setup the selection handler for the select ddl
    $("#select-round").change(function( clicked_object ) {
        let round_selected = $(this).children(":selected").html();
        console.log("Round changed! " + round_selected);
        let selected_round = parseInt( round_selected) - 1;
        // redraw the category information
        initGameBoardFromRound(selected_round);
    });

    // set up the click event for the trivia elements
    $("#triviaTable td").click(function( clicked_object ) {

        clicked_col = parseInt( $(this).index());
        clicked_row = parseInt( $(this).parent().index());

        clicked_element = clicked_object;
        if ( trivia_editable ) {
            // ensure the form is populated with the current value of the table element before open
            // trivia will extract the current value from the stored (local storage) values depending on the td value read
            let roundID = $("#select-round").val() - 1;
            let clue;
            let output = "Trivia: clicked_row = " + clicked_row + ",  clicked_col = " + clicked_col;
            console.log(output);
            // get the game round if necessary
            round = game.getRound(roundID);
            clue = round.board.getClue(clicked_col, clicked_row);

            // get the q & a for the current round           
            let question = clue.question;
            let answer = clue.answer;
            
            if (typeof question == 'undefined'){ question = "<empty>"; }           
            if (typeof answer == 'undefined'){ answer = "<empty>"; }

            //output = "Clue: Question: " + " | " + question + "\nAnswer: " + answer;
            //console.log(output);
            
            // pre-populate the trivia information before modal open
            frm_name_trivia_question.val(question);
            frm_name_trivia_answer.val(answer);

            trivia_dialog.dialog( "open" );
        }
    });

    // set up the click event for the category elements
    $("#triviaTable th").click(function( clicked_object ) {
        clicked_element = clicked_object;

        clicked_col = parseInt( $(this).index());
        clicked_row = parseInt( $(this).parent().index());        

        if ( category_editable ) {

            let roundID = $("#select-round").val() - 1;
            let output = "Category: clicked_row = " + clicked_row + ",  clicked_col = " + clicked_col;
            console.log(output);
            // get the game round so categories are edited correctly
            round = game.getRound(roundID);

            // ensure the form is populated with the current value of the table element before open
            frm_name_category.val($(this).text());
            category_dialog.dialog( "open" );
        }
    });    

    // init default game
    game = initDefaultGame();
    round = game.getRound(0);
    // load the game data for the first round
    initGameBoard();

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
