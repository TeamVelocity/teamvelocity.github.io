"use strict"
/**
 * @file UI setup and interaction.
 */

// globals
let game;
let round;
let playerCount = 3;
let wheel;

let category_editable = false;
let trivia_editable = false;

function startEdit(){
    $(".start-panel").hide();
    $(".edit-panel").show();

    toggleCategoryClicks();
    toggleTriviaClicks();
}

function endEdit(){
    $(".edit-panel").hide();
    $(".start-panel").show();

    toggleCategoryClicks();
    toggleTriviaClicks();
}

function startGame(){
    $(".start-panel").hide();
    $(".play-panel").show();
    $(".spin-phase").show();

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

$(document).ready(function(){
    // hide panels and phases
    $(".edit-panel").hide();
    $(".play-panel").hide();
    $(".spin-phase").hide();
    $(".answer-phase").hide();
    $(".validate-phase").hide();
    $(".complete-phase").hide();

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
    game = engine.initDefaultGame();

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

wheel = {
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

        wheel.base.append("circle")
            .attr("r", "40")
            .attr("fill", "#adc9e2");

        wheel.label = wheel.base.append("text")
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
        wheel.timer = d3.interval(function(elapsed){
            wheel.label.transition()
                .duration(750)
                .text(duration - Math.floor(elapsed/1000));
            if (elapsed > duration * 1000) wheel.timer.stop();
        }, 1000)
    },

    stopTimer: function(){
        wheel.timer.stop();
    },

    resetTimer: function(){
        wheel.stopTimer();
        wheel.label.text("\uf017");

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
