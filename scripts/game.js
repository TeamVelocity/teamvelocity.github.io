"use strict"
/**
 * @file Classes and logic for the Wheel of Jeopardy game.
 */


/**
 * Returns a random integer between min and max).
 * @param {number} max upper bound (exclusive).
 * @param {number} min lower bound (inclusive).
 */
function randomInt(max, min=0) {
    return Math.floor(Math.random() * (max - min) + min);
}

function shuffleArray(arr){
    for (let j=0; j < arr.length * 3; j++){
        let i1 = randomInt(arr.length);
        let i2 = randomInt(arr.length);

        let val1 = arr[i1];
        let val2 = arr[i2];

        arr[i2] = val1;
        arr[i1] = val2;
    }
    return arr;
}

class Clue {
    constructor(column, row, question, answer) {
        this.column = column;
        this.row = row;
        this.question = question;
        this.answer = answer;
        this.points = 0;
    }
}

class Category{
    constructor(name){
        this.name = name;
        this.clues = [];
        this.cluesAnswered = 0;
    }

    get complete(){
        return this.cluesAnswered >= this.clues.length;
    }

    reset(){
        this.cluesAnswered = 0;
    }

    nextClue(){
        let clue = this.clues[this.cluesAnswered];
        this.cluesAnswered++;
        return clue;
    }
}

class Board {
    constructor(columns=6, rows=5, basePoints=200) {
        this.columns;
        this.rows;
        this.basePoints = basePoints;

        this.categories;
        this.cluesAnswered = 0;

        this.init_(columns, rows);
    }

    get complete(){
        return this.cluesAnswered >= this.columns * this.rows;
    }

    get categoryNames(){
        let names = [];
        for(let i=0; i<this.categories.length; i++){
            names.push(this.categories[i].name);
        }
        return names;
    }

    init_(columns=6, rows=5){
        this.categories = [];
        this.columns = columns;
        this.rows = rows;

        for(let i=0; i<this.columns; i++){
            let category = new Category();
            this.categories.push(category);

            for(let j=0; j<this.rows; j++){
                let clue = new Clue();
                clue.column = i;
                clue.row = j;
                clue.points = (j+1) * this.basePoints;
                category.clues.push(clue);
            }
        }
    }

    reset(){
        this.cluesAnswered = 0;
        for(let i=0; i<this.categories.length; i++){
            this.categories[i].reset();
        }
    }

    getCategory(column){
        return this.categories[column];
    }

    getClue(column, row){
        return this.categories[column].clues[row];
    }

    editCategory(column, name){
        let category = this.getCategory(column);
        category.name = name;
    }

    editClue(column, row, question, answer){
        let clue = this.getClue(column, row);
        clue.question = question;
        clue.answer = answer;
    }

    nextClue(column) {
        if (!this.categoryComplete(column)){
            this.cluesAnswered++;
            let category = this.getCategory(column);
            let clue = category.nextClue();
            return clue;
        }
    }

    import(data){
        data = JSON.parse(data);

        // reinitialize board if columns/rows different
        if(this.columns != data.columns || this.rows != data.rows){
            this.init_(data.columns, data.rows);
        }

        // import category names
        for(let i=0; i<data.categories.length; i++){
            this.editCategory(i, data.categories[i]);
        }

        // import clues
        for(let i=0; i<data.clues.length; i++){
            let clue = data.clues[i];
            this.editClue(clue.column, clue.row, clue.question, clue.answer);
        }
    }

    export(){
        let data = {
            "columns": this.columns,
            "rows": this.rows,
            "categories": this.categoryNames,
            "clues": []
        };

        for(let i=0; i<this.columns; i++){
            for(let j=0; j<this.rows; j++){
                let clue = this.getClue(i, j);
                data.clues.push({
                    "column": i,
                    "row": j,
                    "question": clue.question,
                    "answer": clue.answer
                })
            }
        }

        data = JSON.stringify(data);
        return data;
    }
}

class Spin {
    constructor(slot, sectorNumber, sectorName, isCategory, clue){
        this.slot = slot;
        this.sectorNumber = sectorNumber;
        this.sectorName = sectorName;
        this.isCategory = isCategory;
        this.spinAgain = false;
        this.clue = clue;
    }
}

class Wheel {
    constructor(board, maxSpins=50) {
        this.specialSectors = [
            "Lose Turn", 
            "Free Turn", 
            "Bankrupt", 
            "Player's Choice", 
            "Opponent's Choice", 
            "Double Score"
        ]
        this.board = board;
        this.maxSpins = maxSpins;
        this.usedSpins = 0;
        this.slots = [];

        this.assignSectors();
    }

    get complete(){
        return this.usedSpins >= this.maxSpins;
    }

    get sectors(){
        return this.board.categoryNames.concat(this.specialSectors);
    }

    reset(){
        this.usedSpins = 0;
    }

    assignSectors(){
        this.slots = [];

        for(let i=0; i<this.sectors.length; i++){
            this.slots.push(i);
        }
    }

    randomizeSectors(){
        this.slots = shuffleArray(this.slots);
    }

    getSectorNumber(slot){
        return this.slots[slot];
    }

    getSectorName(sectorNumber){
        return this.sectors[sectorNumber];
    }

    sectorIsCategory(sectorNumber){
        if(sectorNumber < this.board.categoryNames.length){
            return true
        } else {
            return false
        }
    }

    getRandomSlot(){
        return randomInt(this.slots.length);
    }

    spin(){
        let spin = new Spin();
        spin.slot = this.getRandomSlot();
        spin.sectorNumber = this.getSectorNumber(spin.slot);
        spin.sectorName = this.getSectorName(spin.sectorNumber);
        spin.isCategory = this.sectorIsCategory(spin.sectorNumber);

        if(spin.isCategory){
            let category = this.board.getCategory(spin.sectorNumber);
    
            if(category.complete){
                spin.spinAgain = true;
            } else {
                let clue = category.nextClue();
                spin.clue = clue;
            }
        }
        this.usedSpins++;
        return spin;
    }
}

/**
 * A score keeper for a single player and round.
 */
class Score {
    constructor(){
        /** {number} Total current points for the round. */
        this.points = 0;
    }

    /** Reset the players points to 0. */
    reset(){
        this.points = 0;
    }

    /**
     * Increase points for the current round.
     * @param {number} points 
     */
    increase(points){
        this.points = this.points + Math.abs(points);
    }

    /**
     * Decrease points for the current round.
     * @param {number} points 
     */
    decrease(points){
        this.points = this.points - Math.abs(points);
    }

    /** If current round points are positive, set to zero. */
    bankrupt(){
        if(this.points > 0){ this.points = 0; }
    }

    /** Double points for the current round. */
    double(){
        this.points = this.points + this.points;
    }
}

class Player {
    constructor(name) {
        this.name = name;
        this.tokens = 0;
        this.scores = [];
    }

    get totalScore(){
        let points = 0;
        for(i=0; i<this.scores.length; i++){
            points += this.scores[i].points;
        }
        return points;
    }

    resetTokens(){
        this.tokens = 0;
    }

    resetScore(round){
        this.scores[round] = new Score();
    }

    getScore(round){
        return this.scores[round];
    }

    addToken(){
        this.tokens += 1;
    }

    hasToken(){
        return this.tokens > 0;
    }

    useToken(){
        if(this.hasToken){
            this.tokens--;
            return true;
        } else {
            return false;
        }
    }
}

class Round {
    constructor(id, wheel, players, maxTime=20){
        this.id = id;
        this.wheel = wheel;
        this.board = wheel.board;
        this.players = players;
        this.maxTime = maxTime;
        this.currentPlayer = 0
    }

    get complete(){
        return this.wheel.complete || this.board.complete
    }

    start(){
        this.reset();
    }

    reset(){
        this.wheel.reset();
        this.board.reset();
        for(let i=0; i<this.players.length; i++){
            this.players[i].resetScore(this.id);
        }
        this.currentPlayer = 0;
    }
}

class Game {
    constructor() {
        this.players = [];
        this.rounds = [];
        this.currentRound = 0;
    }

    addPlayer(name){
        let player = new Player(name);
        this.players.push(player);
    }

    getPlayer(id){
        return this.players[id];
    }

    editPlayer(id, name){
        let player = this.getPlayer(id);
        player.name = name;
    }

    addRound(){
        let id = this.rounds.length;
        let board = new Board();
        let wheel = new Wheel(board)
        let round = new Round(id, wheel, this.players)
        this.rounds.push(round);
        return round;
    }

    getRound(id){
        return this.rounds[id];
    }
}

// node exports
if( typeof module !== 'undefined' && module.exports ) {
    module.exports = {
        Game: Game
    }
}
