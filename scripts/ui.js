"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let game;
let round;
let spin;
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
    valid = valid && checkRegexp( frm_name_category, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");

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
    $(".spin-phase").hide();
    $(".answer-phase").hide();
    $(".validate-phase").hide();
    $(".complete-phase").hide();

    // click - hide alert
    $("#btn-alert").click(function() {
        $("#alert").hide(); 
    });

    // click - start editing
    $("#btn-start-edit").click(function() {
        $(".start-panel").hide();
        $(".edit-panel").show();

        toggleCategoryClicks();
        toggleTriviaClicks();

        // set the game board to the first round before starting edits
        initGameBoardFromRound(0);
        $('select>option:eq(0)').prop('selected', true);
    });

    // click - finish edit
    $("#btn-stop-edit").click(function() {
        $(".edit-panel").hide();
        $(".start-panel").show();

        toggleCategoryClicks();
        toggleTriviaClicks();

        // set the game board to the first round after edits
        initGameBoardFromRound(0);
    });

    // click - export board
    $("#btn-export").click(function() {
        let roundID = $("#select-round").val() - 1;
        let round = game.getRound(roundID)
        download('board.json', round.board.export());
    });

    // click - add player
    $("#btn-add-player").click(function() {
        if (playerCount < 3) {
            $("#player" + playerCount).show();
            playerCount++;
        } else {
            Alert.danger('Maximum of three players supported');
            Alert.hide(2000);
        }
    });

    // click - del player
    $("#btn-del-player").click(function() {
        if (playerCount > 1) {
            playerCount--;
            $("#player" + playerCount).hide();
        } else {
            Alert.danger('Minimum of one player supported');
            Alert.hide(2000);
        }
    });

    // click - start
    $("#btn-play").click(function () {
        // set object visibility
        $(".start-panel").hide();
        $(".play-panel").show();
        $(".spin-phase").show();

        // add players to game api
        for (let i = 0; i < playerCount; i++) {
            let player = $("#player" + i);
            $("#player" + i + " input").prop("readonly", true);
            game.addPlayer($("input", player).val());
        }

        // set api to first round and start
        round = game.getRound(0)
        round.start();

    });

    // click - spin
    $("#btn-spin").click(function () {
        spin = round.spin();

        // update play panel spin count
        playPanel.deductSpin();

        // spin the wheel
        wheel.rotate(spin.slot);

        // selected sector is a category but complete
        if(spin.spinAgain){
            clueText.write("Category complete, spin again");

        // selected sector is a category
        } else if (spin.isCategory){
            $(".spin-phase").hide();
            $(".answer-phase").show();

            playPanel.deductClue();

            wheel.startTimer();
        
        // selected category is a special category
        } else {

        }
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
    game = engine.initDefaultGame();
    round = game.getRound(0);
    
    // load the game data for the first round
    initGameBoard();


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

    let data = [
        { slot: 0, sector: 8, label: '\uf1e2', name: "Bankrupt" },
        { slot: 1, sector: 5, label: 6, name: "Music" },
        { slot: 2, sector: 10, label: '\uf0c0', name: "Opponent's Choice" },
        { slot: 3, sector: 4, label: 5, name: "History" },
        { slot: 4, sector: 6, label: '\uf119', name: "Lose Turn" },
        { slot: 5, sector: 11, label: '\uf155\uf155', name: "Double Score" },
        { slot: 6, sector: 9, label: '\uf007', name: "Player's Choice" },
        { slot: 7, sector: 1, label: 2, name: "Food and Drink" },
        { slot: 8, sector: 2, label: 3, name: "General Knowledge" },
        { slot: 9, sector: 0, label: 1, name: "Art and Literature" },
        { slot: 10, sector: 3, label: 4, name: "Harry Potter" },
        { slot: 11, sector: 7, label: '\uf51e', name: "Free Turn" },
    ]

    wheel.init();
    wheel.create(data);
});

let playPanel = {
    getRound: function () {
        $("#txt-round").text();
    },
    setRound: function(round){
        $("#txt-round").text(round);
    },
    getSpins: function () {
        $("#txt-spins").text();
    },
    setSpins: function (spins) {
        $("#txt-spins").text(spins);
    },
    getClues: function () {
        $("#txt-clues").text();
    },
    setClues: function (clues) {
        $("#txt-clues").text(clues);
    },
    deductSpin: function(i=1) {
        playPanel.setSpins(playPanel.getSpins() - i);
    },
    deductClue: function (i=1) {
        playPanel.setClues(playPanel.getClues() - i);
    }
}

let clueText = {
    empty: function(){
        $("#clue-text").text("");
    },
    write: function(txt){
        $("#clue-text").text(txt);
    }
}

let wheel = {
    init: function (svgID = "#wheel") {
        let svg = d3.select(svgID);
        let width = +svg.attr("width");
        let height = +svg.attr("height");
        wheel.radius = Math.min(width, height) / 2;
        wheel.base = svg.append("g")
            .attr("transform", "translate(" + width/2 + "," + height/2 + ")");
        wheel.g = wheel.base
            .append("g");
        wheel.oldAngle = 0;
        wheel.newAngle = 0;
    },

    create: function (data) {
        wheel.data = data;

        wheel.g.selectAll("*").remove();

        let color = d3.scaleOrdinal(d3.schemeSet3);

        let pie = d3.pie()
            .sort(null)
            .value(function (d) { return 1; });

        let path = d3.arc()
            .outerRadius(wheel.radius - 10)
            .innerRadius(40);

        wheel.label = d3.arc()
            .outerRadius(wheel.radius - 40)
            .innerRadius(wheel.radius - 40);

        let arc = wheel.g.selectAll(".arc")
            .data(pie(wheel.data))
            .enter().append("g")
            .attr("class", "arc");

        arc.append("path")
            .attr("d", path)
            .attr("fill", function (d) { return color(d.data.slot); });

        wheel.text = arc.append("text")
            .attr("transform", function (d) {
                return "translate(" + wheel.label.centroid(d) + ")";
            })
            .attr("dy", "0.35em")
            .text(function (d) { return d.data.label; });

        wheel.timerCircle = wheel.base.append("circle")
            .attr("r", "40")
            .attr("fill", "#adc9e2");

        wheel.timerText = wheel.base.append("text")
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "central")
            .attr("font-size", 32)
            .text("\uf017")
            .attr("id", "timer")
            .classed("fa", true);
    },

    rotate: function (slot = 0) {
        let arcLength = 360 / wheel.data.length;
        let slotArcCenter = arcLength * slot + arcLength / 2;

        wheel.newAngle = 1440 - slotArcCenter;
        let textAngle = 360 - slotArcCenter;

        function rotTween() {
            let i = d3.interpolate(wheel.oldAngle % 360, wheel.newAngle);
            return function (t) {
                return "rotate(" + i(t) + ")";
            };
        }

        wheel.g.transition()
            .attrTween("transform", rotTween)
            .duration(3000)
            .on("end", function () {
                wheel.oldAngle = wheel.newAngle;
            });

        wheel.text.transition()
            .attr("transform", function (dd) {
                let ctr = wheel.label.centroid(dd);
                return "translate(" + ctr + ") rotate(" + (-textAngle) + ")";
            })
            .duration(2000);
    },

    startTimer: function(duration=20){
        wheel.timerText.text("20");
        wheel.timer = d3.interval(function(elapsed){
            wheel.timerText.transition()
                .duration(750)
                .text(duration - Math.floor(elapsed/1000));
            if (elapsed > duration * 1000){
                wheel.timer.stop();
                wheel.timerCircle.attr("fill", "red");
            }
        }, 1000)
    },

    stopTimer: function(){
        wheel.timer.stop();
    },

    resetTimer: function(){
        wheel.stopTimer();
        wheel.timerText.text("\uf017");

    }
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
    static success(msg) {
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-success");
        a.find("#alert-text").empty().text(msg);
        a.show();
    };

    static danger(msg) {
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-danger");
        a.find("#alert-text").empty().html(msg);
        a.show();
    };

    static warning(msg) {
        let a = $("#alert");
        a.removeClass("alert-danger alert-success alert-warning")
            .addClass("alert-warning");
        a.find("#alert-text").empty().html(msg);
        a.show();
    };

    static hide(ms) {
        // set milliseconds to delay hide
        if (ms) {
            setTimeout(function () { $("#alert").hide("slow") }, ms);
        } else {
            $("#alert").hide();
        }
    };
}
