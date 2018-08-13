"use strict"
/***
 * Classes and logic for the Wheel of Jeopardy (WOJ) game.
 */

let engine = (function(){

/**
 * @typedef {Object} GameStats
 */

/**
 * @typedef {Object} RoundStats
 * @property {number} spinsUsed number of spins used.
 * @property {number} cluesAnswered number of clues answered.
 * @property {PlayerStats} currentPlayer stats for current player.
 */

/**
 * @typedef {Object} PlayerStats
 * @property {number} id current player's id.
 * @property {string} name current player's name.
 * @property {number} roundScore current player's round score.
 * @property {number} totalScore current player's total score.
 * @property {number} tokens current player's token count.
 * @property {boolean} hasToken true if current player has token.     
 */

/**
 * Returns a random integer between min and max.
 * @param {number} max upper bound (exclusive).
 * @param {number} min lower bound (inclusive).
 * @returns {number} random integer.
 */
function randomInt(max, min=0){
    return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Naive shuffle an array, swaps random slots 3 * array.length times.
 * @param {Object[]} arr an array to shuffle.
 * @returns {Object[]} shuffled array.
 */
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

/**
 * Initialize the default game setup.
 * @returns {Game} a game intialized with default rounds and no players.
 */
function initDefaultGame(){
    let game = new Game();

    let data = [data1, data2];

    for(let i=0; i<data.length; i++){
        let round = game.addRound();

        round.board.import(JSON.stringify(data[i]));
        round.wheel.assignSectors();
        round.wheel.randomizeSectors();
    }
    return game;
}

/**
 * A single clue, zero indexed from the top left of the board.
 */
class Clue {
    /**
     * @param {number} column horizontal index on board.
     * @param {number} row vertical index on board.
     * @param {string} question the question text.
     * @param {string} answer the answer text.
     */
    constructor(column, row, question, answer) {
        this.column = column;
        this.row = row;
        this.question = question;
        this.answer = answer;

        /** @type {number} value of the clue. */
        this.points = 0;
    }
}

/** 
 * A category of clues on the board. 
 */
class Category{
    /**
     * @param {string} name name of the category.
     */
    constructor(name){
        this.name = name;

        /** @type {Object[]} a list of {@link Clue} objects. */
        this.clues = [];

        /** 
         * @type {number} number of clues in the category that have been 
         * answered. 
         */
        this.cluesAnswered = 0;
    }

    /** @type {boolean} true if all clues in the category have been answered. */
    get complete(){
        return this.cluesAnswered >= this.clues.length;
    }

    /** 
     * Reset clues answered count to 0.
     */
    reset(){
        this.cluesAnswered = 0;
    }

    /** 
     * Retrieve next unanswered clue in the category, increment cluesAnswered.
     * If all clues are answered, this will return undefined.
     * @return {Clue} the next unanswered clue.
     * @throws {Error} throw error when category is complete.
     */
    nextClue(){
        if(this.complete){
            throw new Error("All clues already answered for: " + this.name);
        } else {
            let clue = this.clues[this.cluesAnswered];
            this.cluesAnswered++;
            return clue;
        }
    }
}

/**
 * A WOJ board with column * row clues arranged in a grid. The top left
 * corner is indexed at 0. Each column is a {@link Category} and each row in a 
 * category is a {@link Clue}. All categories must have the same number of 
 * clues. Each clue in the first row has {@link Board#basePoints}. Each clue in
 * the next row equals the sum of the clue value in the prior row plus 
 * basePoints.
 */
class Board {
    /**
     * @param {number} [columns=6] number of columns on the board. 
     * @param {number} [rows=5] number of rows on the board.
     * @param {number} [basePoints=200] point value of each clues in the first 
     * row.
     */
    constructor(columns=6, rows=5, basePoints=200) {
        this.columns;
        this.rows;
        this.basePoints = basePoints;

        /** 
         * @type {Category[]} an array of Categories indexed by column 
         * position. 
         */
        this.categories;

        this.init_(columns, rows);
    }

    /** @type {boolean} true if all clues on the board have been answered. */
    get complete(){
        return this.cluesAnswered >= this.columns * this.rows;
    }

    /** 
     * @type {number} number of clues on the board that have been answered.
     */
    get cluesAnswered(){
        let cluesAnswered = 0;
        for(let i=0; i<this.categories.length; i++){
            cluesAnswered += this.categories[i].cluesAnswered;
        }
        return cluesAnswered;
    }

    /**
     *  @type {string[]} an array of category names indexed by column position.
     */
    get categoryNames(){
        let names = [];
        for(let i=0; i<this.categories.length; i++){
            names.push(this.categories[i].name);
        }
        return names;
    }

    /**
     * Initializes an empty board of size columns * rows with {@link Clue}'s.
     * @private
     * @param {number} columns number of columns on the board. 
     * @param {number} rows number of rows on the board.
     */
    init_(columns, rows){
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

    /** 
     * Resets each category in the board and their cluesAnswered count to 0.
     */
    reset(){
        for(let i=0; i<this.categories.length; i++){
            this.categories[i].reset();
        }
    }

    /**
     * Returns a category at the specified column.
     * @param {number} column column index of the category.
     * @return {Category} category at the specified column.
     */
    getCategory(column){
        return this.categories[column];
    }

    /**
     * Returns a clue at the specified column and row.
     * @param {number} column column index of the clue.
     * @param {number} row row index of the clue.
     * @return {Clue} clue at the specified column and row.
     */
    getClue(column, row){
        return this.categories[column].clues[row];
    }

    /**
     * Edit the name of a category at column index.
     * @param {number} column column index of the category.
     * @param {string} name new category name.
     */
    editCategory(column, name){
        let category = this.getCategory(column);
        category.name = name;
    }

    /**
     * Edit the question and answer of a clue at column and row index.
     * @param {number} column column index of the clue.
     * @param {number} row row index of the clue.
     * @param {string} question new question text.
     * @param {string} answer new answer text.
     */
    editClue(column, row, question, answer){
        let clue = this.getClue(column, row);
        clue.question = question;
        clue.answer = answer;
    }

    /** 
     * Retrieve next unanswered clue in the category at column and increment
     * cluesAnswered for that category. If all clues are answered, this will 
     * return undefined.
     * @param {number} column column index of the category.
     * @return {Clue} the next unanswered clue.
     * @throws {Error} throw error when board is complete.
     */
    nextClue(column) {
        if(this.complete){
            throw new Error("All clues already answered on the board");
        } else {
            let category = this.getCategory(column);
            let clue = category.nextClue();
            return clue;
        }
    }

    /**
     * Import JSON board, initializing board and setting categories and clues.
     * Data should be a string. Use JSON.stringify if data is an object literal.
     * 
     * @param {string} data board JSON.
     * @param {number} data.columns number of columns.
     * @param {numnber} data.rows number of rows.
     * @param {string[]} data.categories array of category names.
     * @param {Object[]} data.clues array of clues, zero indexed from top left
     * of board
     * @param {number} data.clues.column column index of the clue.
     * @param {number} data.clues.row row index of the clue.
     * @param {string} data.clues.question new question text.
     * @param {string} data.clues.answer new answer text.
     * 
     * @see /scripts/data.js
     */
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

    /**
     * Export board content to JSON board string. See {@link Board.import} for
     * details on JSON board structure.
     * @returns {string} serialized board.
     */
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

/** Result of a wheel spin. */
class Spin {
    /**
     * @param {number} slot wheel slot number where spin landed.
     * @param {number} sectorNumber corresponding sector number located at slot.
     * @param {string} sectorName corresponding sector name located at slot.
     * @param {boolean} isCategory true if sector is category.
     * @param {Clue} clue if isCategory is true and spinAgain is false, next
     * clue in the category.
     * @param {boolean} spinAgain true if category is complete.
     */
    constructor(slot, sectorNumber, sectorName, isCategory, clue, spinAgain=false){
        this.slot = slot;
        this.sectorNumber = sectorNumber;
        this.sectorName = sectorName;
        this.isCategory = isCategory;
        this.clue = clue;
        this.spinAgain = spinAgain;
    }
}

/** 
 * A WOJ wheel for a specific board and maximum spins. The number of slots on
 * the wheel will be the number of categories + the number of special sectors
 * (6). Slots are fixed on the wheel. Each special and category is a sector.
 * Each sector can be randomly assigned to a slot on the wheel. Categories are
 * always populated in the sector list first, followed by special sectors, i.e.
 * category 0 on the board is always sector 0 on the wheel.
 */
class Wheel {
    /**
     * @param {Board} board an initialized WOJ board.
     * @param {number} [maxSpins=50] the max spins allowed.
     */
    constructor(board, maxSpins=50) {
        this.board = board;
        this.maxSpins = maxSpins;

        /**
         * @type {string[]} a list of six special sectors.
         */
        this.specialSectors = [
            "Lose Turn", 
            "Free Turn", 
            "Bankrupt", 
            "Player's Choice", 
            "Opponent's Choice", 
            "Double Score"
        ]

        /**
         * @type {number} number of spins used.
         */
        this.usedSpins = 0;

        /**
         * @type {number} sector numbers in each slot.
         */
        this.slots = [];

        this.assignSectors();
    }

    /** @type {boolean} true if all spins have been used. */
    get complete(){
        return this.usedSpins >= this.maxSpins;
    }

    /**
     * @type {string[]} array of ordered sector names: categories + special
     * sectors.
     */
    get sectors(){
        return this.board.categoryNames.concat(this.specialSectors);
    }

    /** 
     * Resets used spins to 0.
     */
    reset(){
        this.usedSpins = 0;
    }

    /**
     * Assigns sectors numbers to each slot ordered by categories then special.
     */
    assignSectors(){
        this.slots = [];

        for(let i=0; i<this.sectors.length; i++){
            this.slots.push(i);
        }
    }

    /**
     * Randomizes sectors in the slots.
     */
    randomizeSectors(){
        this.slots = shuffleArray(this.slots);
    }

    /**
     * Get sector number at a specific slot number.
     * @param {number} slot slot number in the wheel.
     * @return {number} sector number at the specified slot.
     */
    getSectorNumber(slot){
        return this.slots[slot];
    }

    /**
     * Get sector name for the specific sector number.
     * @param {number} sectorNumber sector number.
     * @return {number} sector name for the sector number.
     */
    getSectorName(sectorNumber){
        return this.sectors[sectorNumber];
    }

    /**
     * Check if the sector is a category (vs a special sector).
     * @param {number} sectorNumber number of the sector.
     * @return {boolean} true if the sector is a category.
     */
    sectorIsCategory(sectorNumber){
        if(sectorNumber < this.board.categoryNames.length){
            return true
        } else {
            return false
        }
    }

    /**
     * Return a random slot number from the wheel.
     * @returns {number} a random slot number.
     */
    getRandomSlot(){
        return randomInt(this.slots.length);
    }

    /**
     * Spins the wheel and returns a random sector. Populates the {@link Spin}
     * object with the spin results. If the result is a category, a clue will
     * be retrieved. If all clues are used, the spin again field will be
     * true.
     * @returns {Spin} object summarizing result of the spin.
     */
    spin(){
        let spin = new Spin();
        spin.slot = this.getRandomSlot();
        spin.sectorNumber = this.getSectorNumber(spin.slot);
        spin.sectorName = this.getSectorName(spin.sectorNumber);
        spin.isCategory = this.sectorIsCategory(spin.sectorNumber);

        if(spin.isCategory){
            let categoryColumn = spin.sectorNumber;
            let category = this.board.getCategory(categoryColumn);

            if(category.complete){
                spin.spinAgain = true;
            } else {
                let clue = this.board.nextClue(categoryColumn);
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
        /** 
         * @type {number} current points for the round. 
         */
        this.points = 0;
    }

    /** Reset points to 0. */
    reset(){
        this.points = 0;
    }

    /**
     * Increase points by a number (sign ignored).
     * @param {number} points number of points to increase.
     */
    increase(points){
        this.points = this.points + Math.abs(points);
    }

    /**
     * Decrease points by a number (sign ignored).
     * @param {number} points number of points to decrease.
     */
    decrease(points){
        this.points = this.points - Math.abs(points);
    }

    /** If points are positive, set points to 0. */
    bankrupt(){
        if(this.points > 0){ this.points = 0; }
    }

    /** Double points, even if negative. */
    double(){
        this.points = this.points + this.points;
    }
}

/**
 * A player in the WOJ game.
 */
class Player {
    /**
     * @param {number} id A unique numeric ID for the player.
     * @param {string} [name] the players name.
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;

        /**
         * @type {number} number of tokens (free turns).
         */
        this.tokens = 0;

        /**
         * @type {Score[]} array of scores, indexed by round number, i.e. 0 is
         * the first round.
         */
        this.scores = [];
    }

    /** @type {numbner} sum of points for all rounds. */
    get totalScore(){
        let points = 0;
        for(let i=0; i<this.scores.length; i++){
            points += this.scores[i].points;
        }
        return points;
    }

    /** Sets the player's tokens to 0. */
    resetTokens(){
        this.tokens = 0;
    }

    /**
     *  Reset score for round to 0.
     * @param {number} round number of the round, 0 is round 1.
     */
    resetScore(round){
        this.scores[round] = new Score();
    }

    /**
     * Return the score for a given round number.
     * @param {number} round number of the round, 0 is round 1.
     * @returns {number} score for the given round number.
     */
    getScore(round){
        return this.scores[round];
    }

    /**
     * Adds 1 token to the player's tokens.
     */
    addToken(){
        this.tokens += 1;
    }

    /**
     * Checks if the player has any tokens.
     * @returns true if the player has at least one token.
     */
    hasToken(){
        return this.tokens > 0;
    }

    /**
     * Deduct a token, if the player has one.
     * @returns {boolean} true if the token was deducted.
     * @throws {Error} throws error if the player has no tokens.
     */
    useToken(){
        if(this.hasToken()){
            this.tokens--;
            return true;
        } else {
            throw new Error('Player does not have any tokens.')
        }
    }
}

/**
 * A round in the WOJ game. The standard game is played with two rounds.
 */
class Round {
    /**
     * @param {number} id A unique numeric ID for the round.
     * @param {Wheel} wheel a wheel for the round.
     * @param {Player[]} players an array of players in the game.
     * @param {number} [maxTime=20] maximum time to answer a question in
     * seconds.
     */
    constructor(id, wheel, players, maxTime=20){
        this.id = id;
        this.wheel = wheel;
        this.players = players;
        this.maxTime = maxTime;

        /**
         * @type {Board} a board for the round.
         */
        this.board = wheel.board;

        /**
         * @type {number} player id of the player currently spinning.
         */
        this.currentPlayerID = 0

        /**
         * @type {Spin} latest Spin resulting from spin.
         */
        this.currentSpin;

        /**
         * @type {Clue} latest Clue resulting form spin or pickCategory.
         */
        this.currentClue;

        /**
         * @type {boolean} true if the round is ready to begin.
         * @private
         */
        this.roundReady_ = false;

        /**
         * @type {boolean} true if the current turn is complete.
         * @private
         */
        this.turnComplete_ = true; 

    }

    /** @type {boolean} true if the round is complete. */
    get complete(){
        return this.wheel.complete || this.board.complete
    }

    /**
     * Stats for the current round, including spins used, clues answered, and
     * attributes for the player who has the current turn, e.g. score, tokens.
     * @returns {RoundStats} current stats for the round.
     */
    get stats(){
        let stats = {
            spinsUsed: this.wheel.usedSpins,
            cluesAnswered: this.board.cluesAnswered,
            currentPlayer: {
                id: this.currentPlayer.id,
                name: this.currentPlayer.name,
                roundScore: this.currentPlayerScore_.points,
                totalScore: this.currentPlayer.totalScore,
                tokens: this.currentPlayer.tokens,
                hasToken: this.currentPlayer.hasToken()
            }
        }
        return stats;
    }

    /**
     * Current player's player object.
     * @return {Player} current player's player object.
     */
    get currentPlayer(){
        return this.players[this.currentPlayerID];
    }

    /**
     * Current player's score object.
     * @returns {Score} current players score object.
     * @private
     */
    get currentPlayerScore_(){
        return this.currentPlayer.scores[this.id]
    }

    /**
     * Start the WOJ round.
     */
    start(){
        this.reset();
    }

    /**
     * Resets the current round by reseting the wheel, board, and player scores.
     */
    reset(){
        this.wheel.reset();
        this.board.reset();
        for(let i=0; i<this.players.length; i++){
            this.players[i].resetScore(this.id);
        }
        this.currentPlayerID = 0;
        this.roundReady_ = true;
        this.turnComplete_ = true; 
    }

    /**
     * Spins the wheel and returns the result in a Spin object. If Free Turn,
     * Bankrupt, or Double Score are landed, the players tokens or score is
     * adjusted. If Player's Choice or Opponent's Choice are landed, use
     * pickCategory to get the next clue.
     * @returns {Spin} result of the spin.
     */
    spin(){
        if(this.complete){
            // check if the round is complete
            let msg = 'Round complete, must start new round or end the game.';
            throw new Error(msg);
        } else if(!this.roundReady_){
            // did not start round
            throw new Error('Must call start before round can begin.');
        } else if(!this.turnComplete_) {
            // check if turn is complete
            let msg = `
                Must complete current turn before spinning again by calling 
                validAnswer, endTurn, or useToken.
            `;
            throw new Error(msg)
        }else{
            // spin wheel
            this.turnComplete_ = false;

            let spin = this.wheel.spin();
            this.currentSpin = spin;

            if(spin.isCategory){
                // category sector
                if(!spin.spinAgain){
                    // valid clue
                    this.currentClue = spin.clue;
                }
            } else {
                // special sector
                switch(spin.sectorName){
                    case "Free Turn":
                        this.currentPlayer.addToken();
                        break;
                    case "Lose Turn":
                        break;
                    case "Bankrupt":
                        this.currentPlayerScore_.bankrupt();
                        break;
                    case "Player's Choice":
                        break;
                    case "Opponent's Choice":
                        break;
                    case "Double Score":
                        this.currentPlayerScore_.double();
                        break;
                    default:
                        // do nothing
                }
            }
            return spin;
        }
    }

    /**
     * When spin is Player's Choice or Opponent's Choice, use pickCategory,
     * to get the next clue from the specificed category. This will set the
     * currentClue.
     * @param {number} column column index of the category.
     * @returns {Clue} next unanswered clue in the category.
     * @throws {Error} throws error if current spin sector does not permit
     *  picking a category, i.e. it is not Player's Choice or Opponents Choice.
     */
    pickCategory(column){
        let validOpt = ["Player's Choice", "Opponent's Choice"];
        let specialSector = !this.currentSpin.isCategory
        if(specialSector && validOpt.includes(this.currentSpin.sectorName)){
            let category = this.board.getCategory(column);
            let clue = category.nextClue();
            this.currentClue = clue;
            return clue;
        } else {
            let msg = 'pickCategory is not allowed for current spin sector: ' + 
                this.currentSpin.sectorName;
            throw new Error(msg);
         }
    }

    /**
     * When Spin resulted in a clue or pickCategory was used to set a clue, call
     * this method if the player answered correctly, to adjust their score.
     * @throws {Error} throws error if no clue is set to validate.
     */
    validAnswer(){
        if(this.currentClue === undefined){
            throw new Error('Check spin result, no clue was set.');
        } else {
            this.currentPlayerScore_.increase(this.currentClue.points);
            this.resetTurn_();
        }
    }

    /**
     * When Spin resulted in a clue or pickCategory was used to set a clue, call
     * this method if the player answered incorrectly, to adjust their score.
     * @throws {Error} throws error if no clue is set to validate.
     */
    invalidAnswer(){
        if(this.currentClue === undefined){
            throw new Error('Check spin result, no clue was set.');
        } else {
            this.currentPlayerScore_.decrease(this.currentClue.points);
        }
    }


    /**
     * Private method to reset the turn: currentSpin and currentClue are set
     * to undefined.
     * @private
     */
    resetTurn_(){
        this.currentSpin = undefined;
        this.currentClue = undefined;
        this.turnComplete_ = true;
    }

    /**
     * Use a free turn token for the current player. A token may be used if the
     * player loses his turn or answers a question incorrectly. A token cannot
     * be used if the player spins free turn.
     * @returns {boolean} true if succesfully used token, false otherwise.
     * @throws {Error} throws error if player does not have any tokens.
     * @throws {Error} throws error if the current spin is Free Turn.
     */
    useToken(){
        let specialSector = !this.currentSpin.isCategory;
        if(specialSector && this.currentSpin.sectorName == 'Free Turn'){
            throw new Error('Free turn not allowed when sector is Free Turn')
        } else {
            try {
                let token = this.currentPlayer.useToken();
                this.resetTurn_();
                return token;
            } catch (e) {
                throw e;
            }
        }
    }

    /**
     * End the current players turn, should be called after a spin and
     * validation (if applicable) is complete. This method will switch to the
     * next player and reset the currentSpin and currentClue.
     */
    endTurn(){
        this.resetTurn_();

        this.currentPlayerID++;
        if(this.currentPlayerID == this.players.length){
            // restart from first player
            this.currentPlayerID = 0;
        }
    }
}

/**
 * The WOJ game. Supports creation of board, wheel, and players which are
 * used to track game play. This class should be used to create games and add
 * rounds to ensure proper functionality.
 * 
 * @example
 * let game = new Game();
 * 
 * // create default boards
 * let data = [data1, data2];
 * 
 * for(let i=0; i<data.length; i++){
 *      let round = game.addRound();
 *      round.board.import(JSON.stringify(data[i]));
 *      round.wheel.assignSectors();
 *      round.wheel.randomizeSectors();    
 * }
 * 
 * // edit board content if needed
 * round = game.getRound(0);
 * let clue = round.board.getCategory(1).clues[2];
 * clue.question = "What is the oldest soft drink in America?";
 * clue.answer = "Dr. Pepper.";
 * 
 * // start game
 * game.addPlayer("John");
 * game.addPlayer("Jane");
 * 
 * // start first round
 * round = game.getRound(0);
 * round.start();
 * 
 * // player spins
 * console.log(round.currentPlayer);
 * let spin = round.wheel.spin();
 * console.log(spin);
 * console.log(round.complete);
 */
class Game {
    constructor() {
        /** @type {Player[]} array of players. */
        this.players = [];

        /** @type {Rounds[]} array of rounds. */
        this.rounds = [];

        /** @type {number} current round number. */
        this.currentRound = 0;
    }

    /**
     * Stats for the game.
     * @returns {GameStats} current stats for the game.
     */
    get stats(){
        let stats = {
            // add game wide stats
        }
        return stats;
    }

    /** 
     * Add a player to the game. Players are assigned an ID starting with 0 and
     * incrementing by 1.
     * @param {string} name the players name.
     * @returns {number} auto assigned player ID.
     */
    addPlayer(name){
        let id = this.players.length;
        let player = new Player(id, name);
        this.players.push(player);
        return player;
    }

    /**
     * Retrieve a player.
     * @param {number} id the players id number.
     * @returns {Player} the player at index number.
     */
    getPlayer(id){
        return this.players[id];
    }

    /**
     * Retrieve and edit a player.
     * @param {number} id the players id number, player one is id: 0.
     * @param {string} name the players name.
     */    
    editPlayer(id, name){
        let player = this.getPlayer(id);
        player.name = name;
    }

    /**
     * Add and initialize a game round with an empty wheel and board. Rounds are
     * assigned an ID starting with 0 and incrementing by 1.
     * @returns {id} auto assigned round ID.
     */
    addRound(){
        let id = this.rounds.length;
        let board = new Board();
        let wheel = new Wheel(board)
        let round = new Round(id, wheel, this.players)
        this.rounds.push(round);
        return round;
    }

    /**
     * Retrieve a game round by id.
     * @param {Round} id the rounds id number, round one is id: 0.
     */
    getRound(id){
        return this.rounds[id];
    }

    /**
     * Retrieve array of players ordered by top score.
     * @returns {Player[]} array of players ordered by total score.
     */
    getLeaderBoard(){
        let leaders = this.players.slice();
        leaders.sort(function(obj1, obj2){
            return obj2.totalScore - obj1.totalScore;
        });
        return leaders;
    }
}

// node exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Game: Game,
        Round: Round,
        Player: Player,
        Score: Score
    }
}

return {
    Game:Game,
    initDefaultGame:initDefaultGame
}

})();
