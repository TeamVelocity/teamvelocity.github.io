"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let debug = false;
let game;
let round;
let spin;
let playerCount = 3;
let categorySelectable = false;

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

$(document).ready(function() {
    // hide panels
    hidePanels();

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

    // click - start game
    $("#btn-play").click(function () {
        // set object visibility
        $(".start-panel").hide();
        $(".play-panel").show();
        $(".spin-phase").show();

        // add players to game api
        for (let i = 0; i < playerCount; i++) {
            let playerName = $("#player" + i).val();
            $("#player" + i + " input").prop("readonly", true);

            if (playerName == ""){
                playerName = "Player " + (i + 1);
            }
            game.addPlayer(playerName);
        }

        // start api round
        let id = 0;
        round = game.getRound(id);
        round.start();

        // update wheel
        wheel.buildCreate(round);

        // set player 0 as first
        player.startTurn(0);
    });

    // click - spin
    $("#btn-spin").click(function () {

        if(round.complete){
            if(game.complete){
                display.endGame();
                return;

            } else {
                dialog.endRound();

                // start new round
                game.currentRound++;
                let roundID = game.currentRound;

                round = game.getRound(roundID);
                round.start();

                wheel.buildCreate(round);
                initGameBoardFromRound(roundID);

                clueText.empty();
                playPanel.reset();
                playPanel.setRound(roundID + 1);
                return
            }
        }

        spin = round.spin();

        // update play panel spin count
        playPanel.deductSpin();

        // spin the wheel
        wheel.rotate(spin.slot, function(){
            // selected sector is a category but complete
            if (spin.spinAgain) {
                clueText.write("Category complete, spin again");                
                round.endTurn();

            // selected sector is a category
            } else if (spin.isCategory) {
                displayClue();

            // selected category is a special category
            } else {
                // update the players UI stats
                let currentPlayer = round.currentPlayer;
                player.setPoints(currentPlayer.id, currentPlayer.totalScore);
                player.setTokens(currentPlayer.id, currentPlayer.tokens);

                // special sector
                switch (spin.sectorName) {
                    case "Free Turn":
                        clueText.write("You landed on Free Turn!");                        
                        switchPlayer();
                        break;
                        
                    case "Lose Turn":
                        clueText.write("You landed on Lose Turn!");
                        if (currentPlayer.hasToken()){
                            // present option to use token
                            $(".answer-phase").hide();
                            $(".token-phase").show();
                        } else {
                            // switch to next player
                            switchPlayer();
                        }
                        break;

                    case "Bankrupt":
                        clueText.write("You landed on Bankrupt!");
                        switchPlayer();
                        break;

                    case "Player's Choice":
                        clueText.write("You landed on Player's Choice!\nSelect an open category on the board");
                        categorySelectable = true;
                        $(".spin-phase").hide();
                        break;

                    case "Opponent's Choice":
                        clueText.write("You landed on Opponent's Choice!\nSelect an open category on the board");
                        categorySelectable = true;
                        $(".spin-phase").hide();
                        break;

                    case "Double Score":
                        clueText.write("You landed on Double Score!");
                        switchPlayer();
                        break;
                    default:
                    // do nothing
                }
            }
        });
    });

    // click - answer
    $("#btn-answer").click(function () {
        wheel.stopTimer();
        clueText.write(round.currentClue.answer);

        $(".answer-phase").hide();
        $(".validate-phase").show();
    });

    // click - valid
    $("#btn-valid").click(function () {
        wheel.resetTimer();

        // update board UI
        let clue = round.currentClue;
        board.setValidClue(clue.column, clue.row);

        // update players score in api
        round.validAnswer();

        // update players score in UI
        let currentPlayer = round.currentPlayer;
        player.setPoints(currentPlayer.id, currentPlayer.totalScore);

        $(".validate-phase").hide();
        $(".spin-phase").show();
    });

    // click - invalid
    $("#btn-invalid").click(function () {
        wheel.resetTimer();

        let clue = round.currentClue;
        board.setInvalidClue(clue.column, clue.row);

        // update players score in api
        round.invalidAnswer();

        // update players score in UI
        let currentPlayer = round.currentPlayer;
        player.setPoints(currentPlayer.id, currentPlayer.totalScore);

        if (currentPlayer.hasToken()) {
            // present option to use token
            $(".validate-phase").hide();
            $(".token-phase").show();
        } else {
            // switch to next player
            switchPlayer();
            $(".validate-phase").hide();
            $(".spin-phase").show();
        }
    });

    // click - token
    $("#btn-token").click(function () {
        round.useToken();

        let currentPlayer = round.currentPlayer;
        player.setTokens(currentPlayer.id, currentPlayer.tokens);

        $(".token-phase").hide();
        $(".spin-phase").show();
    });

    // click - end turn
    $("#btn-end-turn").click(function () {
        switchPlayer();
        $(".token-phase").hide();
        $(".spin-phase").show();
    });

    // click - reset
    $("#btn-reset").click(function () {
        game.getRound(0).reset();
        game.getRound(1).reset();

        round = game.getRound(0);
        categorySelectable = false;
        
        wheel.buildCreate(round);
        initGameBoardFromRound(roundID);

        clueText.empty();
        playPanel.reset();
        player.reset();

        wheel.rotate();
        wheel.resetTimer();

        hidePanels();
        $(".start-panel").show();
    }); 

    // set up the edit category dialog
    category_dialog = $("#category-form").dialog({
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true,
        buttons: {
            "Edit Category": editCategory,
            Cancel: function () {
                category_dialog.dialog("close");
            }
        },
        close: function () { frm_name_category.removeClass("ui-state-error"); }
    });

    // setup the edit trivia dialog
    trivia_dialog = $("#trivia-form").dialog({
        autoOpen: false,
        height: 400,
        width: 350,
        modal: true,
        buttons: {
            "Edit Trivia": editTrivia,
            Cancel: function () {
                trivia_dialog.dialog("close");
            }
        },
        close: function () {
            frm_name_trivia_question.removeClass("ui-state-error");
            frm_name_trivia_answer.removeClass("ui-state-error");
        }
    });

    // set up the form to edit the category text
    category_form = category_dialog.find("form").on("submit", function (submit_event) {
        submit_event.preventDefault();
        frm_name_category.val("");
    });

    // set up the form to edit the trivia text
    trivia_form = trivia_dialog.find("form").on("submit", function (submit_event) {
        submit_event.preventDefault();
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

        // player or opponent choice
        if (categorySelectable) {
            Alert.warning("Select a Category Above.")
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

        // player or opponent choice
        if (categorySelectable){
            let category = round.board.getCategory(clicked_col);

            // category is already finished
            if(category.complete){
                let msg = 'Select a different category, ' + category.name + ' is complete'
                Alert.warning(msg);
                Alert.hide(2000);
            } else {
                round.pickCategory(clicked_col);
                categorySelectable = false;
                displayClue();
            }
        }
    });

    // setup the default UI and API
    let roundID = 0;

    // init api objects
    game = engine.initDefaultGame();
    round = game.getRound(roundID);

    // init ui wheel
    wheel.init();
    wheel.buildCreate(round);

    // init ui board
    initGameBoard();

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

    // reset board css
    for(let column=0; column<round.board.columns; column++){
        for (let row = 0; row<round.board.rows; row++) {
            board.removeStyle(column, row);
        }
    }
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
    if (category_editable) { category_editable = false; }
    else { category_editable = true; }
}

function toggleTriviaClicks() {
    if (trivia_editable) { trivia_editable = false; }
    else { trivia_editable = true; }
}

function editCategory() {
    let valid = true;
    frm_name_category.removeClass("ui-state-error");
    valid = valid && checkLength(frm_name_category, "category", 3, 32);
    valid = valid && checkRegexp(frm_name_category, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");

    // validates the form's input field, and closes the modal
    if (valid) {
        let category_updated = frm_name_category.val();
        clicked_element.target.innerHTML = category_updated;
        console.log("Input: Category Update: " + category_updated);
        round.board.editCategory(clicked_col, category_updated);
        category_dialog.dialog("close");
    }
    return valid;
}

function editTrivia() {
    let valid = true;
    frm_name_trivia_question.removeClass("ui-state-error");
    frm_name_trivia_answer.removeClass("ui-state-error");

    valid = valid && checkLength(frm_name_trivia_question, "trivia", 3, 256);
    valid = valid && checkRegexp(frm_name_trivia_question, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");
    valid = valid && checkLength(frm_name_trivia_answer, "trivia", 3, 256);
    valid = valid && checkRegexp(frm_name_trivia_answer, /^[0-9a-zA-Z]([0-9a-zA-Z_\s,\&\^\%\$\#\@\!\)\(\*\[\]\{\}\-\_\.\?\'\‘\’])+$/i, "Input must begin with letters, or numbers; it may contain special characters.");

    // validates the form's input field, and closes the modal
    if (valid) {
        // store the user's trivia information in the local session table
        let question = frm_name_trivia_question.val();
        let answer = frm_name_trivia_answer.val();
        console.log("Input: \nQuestion: " + question + "\nAnswer: " + answer);
        round.board.editClue(clicked_col, clicked_row, question, answer);

        trivia_dialog.dialog("close");
    }
    return valid;
}

function updateTips(t) {
    tips
        .text(t)
        .addClass("ui-state-highlight");
    setTimeout(function () {
        tips.removeClass("ui-state-highlight", 3000);
    }, 1500);
}

function checkLength(o, n, min, max) {
    if (o.val().length > max || o.val().length < min) {
        o.addClass("ui-state-error");
        updateTips("Length of " + n + " must be between " + min + " and " + max + ".");
        return false;
    } else {
        return true;
    }
}

function checkRegexp(o, regexp, n) {
    if (!(regexp.test(o.val()))) {
        o.addClass("ui-state-error");
        updateTips(n);
        return false;
    } else { return true; }
}

let player = {
    setPoints: function (id, points){
        $("#player" + id + " .points").text(points);
    },

    setTokens: function (id, tokens){
        $("#player" + id + " .tokens").text(tokens);
    },

    startTurn: function(id){
        $("#player" + id + " input").toggleClass("current-turn", true);
    },
    
    endTurn: function (id) {
        $("#player" + id + " input").toggleClass("current-turn", false);
    },

    readOnlyOn: function (id){
        $("#player" + id + " input").prop("readonly", true);
    },

    readOnlyOff: function (id) {
        $("#player" + id + " input").prop("readonly", false);
    },

    reset: function(){
        for(let i=0; i<playerCount; i++){
            player.setPoints(i, 0);
            player.setTokens(i, 0);
            player.startTurn(i);
            player.endTurn(i);
            player.readOnlyOff(i);
        }
        player.startTurn(0);
        playerCount = 3;
    }
}

let playPanel = {
    getRound: function () {
        return $("#txt-round").text();
    },
    setRound: function(round){
        $("#txt-round").text(round);
    },
    getSpins: function () {
        return $("#txt-spins").text();
    },
    setSpins: function (spins) {
        $("#txt-spins").text(spins);
    },
    getClues: function () {
        return $("#txt-clues").text();
    },
    setClues: function (clues) {
        $("#txt-clues").text(clues);
    },
    deductSpin: function(i=1) {
        playPanel.setSpins(playPanel.getSpins() - i);
    },
    deductClue: function (i=1) {
        playPanel.setClues(playPanel.getClues() - i);
    },
    reset: function(){
        playPanel.setRound(1);
        playPanel.setSpins(50);
        playPanel.setClues(30);
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

        wheel.width = width;
        wheel.height = height;
    },

    specialSectorLabels: {
        "Bankrupt": '\uf1e2',
        "Opponent's Choice": '\uf0c0',
        "Lose Turn": '\uf119',
        "Double Score": '\uf155\uf155',
        "Player's Choice": '\uf007',
        "Free Turn": '\uf51e'
    },

    buildCreate: function(round){
        let data = wheel.buildData(round);
        wheel.create(data);
    },

    buildData: function(round) {
        let w = round.wheel;
        let data = [];
        
        for(let i=0; i<w.slots.length; i++){
            let slot = {};
            let sectorNumber = w.slots[i];
            let sectorName = w.getSectorName(sectorNumber);
            slot['slot'] = i;
            slot['sector'] = sectorNumber;
            slot['name'] = sectorName;

            if(w.sectorIsCategory(sectorNumber)){
                slot['label'] = 1 + sectorNumber;
            } else {
                slot['label'] = wheel.specialSectorLabels[sectorName];
            }
            data.push(slot);
        }
        return data;
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

        var symbol = d3.symbol()
            .type(d3.symbolTriangle)
            .size(200);

        let pointerY = wheel.radius - 10;
        wheel.base.append("path")
            .attr('d', symbol)
            .attr('transform', 'rotate(180) translate(0, ' + pointerY + ')');

    },

    rotate: function (slot = 0, callback=function(){}) {
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

        if(debug){
            let sectorDuration = 0;
            let textDuration = 0;
        } else {
            let sectorDuration = 3000;
            let textDuration = 2000;
        }

        wheel.g.transition()
            .attrTween("transform", rotTween)
            .duration(function(){
                return (debug) ? 0 : 3000;
            })
            .on("end", function () {
                wheel.oldAngle = wheel.newAngle;
                callback();
            });

        wheel.text.transition()
            .attr("transform", function (dd) {
                let ctr = wheel.label.centroid(dd);
                return "translate(" + ctr + ") rotate(" + (-textAngle) + ")";
            })
            .duration(function(){
                return (debug) ? 0 : 2000;
            });
    },

    startTimer: function(duration=20){
        wheel.timerText.text("20");
        wheel.timer = d3.interval(function(elapsed){
            wheel.timerText.transition()
                .duration(750)
                .text(duration - Math.floor(elapsed/1000));

            // 25% of time remains
            if (elapsed > duration * 0.75 * 1000) {
                wheel.timerCircle.attr("fill", "red");
            }

            // time expires
            if (elapsed > duration * 1000){
                wheel.resetTimer();

                let clue = round.currentClue;
                board.setExpiredClue(clue.column, clue.row);

                clueText.write("Time Expired!");
                $(".answer-phase").hide();
                if (round.currentPlayer.hasToken()) {
                    // present option to use token
                    $(".token-phase").show();
                } else {
                    // switch to next player
                    switchPlayer();
                    $(".spin-phase").show();
                }

                wheel.timerText.transition()
                    .duration(750)
                    .text("\uf017");
            }
        }, 1000)
    },

    stopTimer: function(){
        wheel.timer.stop();
    },

    resetTimer: function(){
        wheel.stopTimer();
        wheel.timerText.text("\uf017");
        wheel.timerCircle.attr("fill", "#adc9e2");
    }
}

let board = {
    setActiveClue: function(column, row){
        $("#t_" + column + "_" + row).toggleClass("current-clue", true);
    },

    setValidClue: function(column, row){
        $("#t_" + column + "_" + row).toggleClass("current-clue", false);
        $("#t_" + column + "_" + row).toggleClass("valid-clue", true);
    },

    setInvalidClue: function (column, row) {
        $("#t_" + column + "_" + row).toggleClass("current-clue", false);
        $("#t_" + column + "_" + row).toggleClass("invalid-clue", true);
    },
    setExpiredClue: function (column, row) {
        $("#t_" + column + "_" + row).toggleClass("current-clue", false);
        $("#t_" + column + "_" + row).toggleClass("expired-clue", true);
    },
    removeStyle: function(column, row){
        $("#t_" + column + "_" + row).toggleClass("current-clue", false);
        $("#t_" + column + "_" + row).toggleClass("valid-clue", false);
        $("#t_" + column + "_" + row).toggleClass("invalid-clue", false);
        $("#t_" + column + "_" + row).toggleClass("expired-clue", false);
        }

}

let dialog = {
    show: function (title, text) {
        $("#dialog").attr("title", title)
            .html("<p>" + text + "</p>");

        $("#dialog").dialog({
            modal: true,
            buttons: [{
                text: "OK",
                click: function () {
                    $(this).dialog("close");
                }
            }],
            close: function (event, ui) {
                wheel.rotate();
            }
        });
    },

    endRound: function () {
        let title = "Round Complete";
        let roundNumber = game.currentRound + 1;
        let text = "Round " + roundNumber + " is complete.<br><br>"

        let leaders = game.getLeaderBoard();
        for (let i = 0; i < leaders.length; i++) {
            text += leaders[i].name + ": " + leaders[i].totalScore + "<br>";
        }
        dialog.show(title, text);
    },

    endGame: function () {
        let title = "Game Complete";
        let roundNumber = game.currentRound + 1;
        let text = "Game is complete.<br><br>"

        let leaders = game.getLeaderBoard();
        for (let i = 0; i < leaders.length; i++) {
            text += leaders[i].name + ": " + leaders[i].totalScore + "<br>";
        }
        dialog.show(title, text);
    }
}

function displayClue(){
    $(".spin-phase").hide();
    $(".answer-phase").show();
    
    playPanel.deductClue();

    let clue = round.currentClue;
    let points = clue.points;
    let category = round.board.getCategory(clue.column).name;

    board.setActiveClue(clue.column, clue.row);
    clueText.write(category + " (" + points +")\n" + clue.question);

    wheel.startTimer();
}

function switchPlayer(){
    // end current players turn and toggle UI
    player.endTurn(round.currentPlayerID);
    round.endTurn();
    player.startTurn(round.currentPlayerID);
}

function hidePanels(){
    $(".edit-panel").hide();
    $(".play-panel").hide();
    $(".spin-phase").hide();
    $(".answer-phase").hide();
    $(".validate-phase").hide();
    $(".token-phase").hide();
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

function upload(event){
    let input = event.target;

    let reader = new FileReader();
    reader.onload = function () {
        // should prob add some validation...
        let roundID = $("#select-round").val() - 1;
        let round = game.getRound(roundID)
        round.board.import(reader.result);
        initGameBoardFromRound(roundID);
        Alert.success('Loaded: ' + input.files[0].name);
        Alert.hide(2000);
    };

    reader.onerror = function (event) {
        Alert.warning('File error: ' + event.target.error.code);
        Alert.hide(2000);
    };

    reader.readAsText(input.files[0]);
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
