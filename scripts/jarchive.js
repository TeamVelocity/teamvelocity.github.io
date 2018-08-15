let jarchive = {
    get: function (gameId, round=1, callback){
        let webUrl = 'https://whatever-origin.herokuapp.com/get?url=';
        let jaUrl = 'http://www.j-archive.com/showgame.php?game_id=' + gameId + '&callback=?';

        $.getJSON(webUrl + jaUrl, function (data) {
            callback(data.contents);
        }).fail(function () { alert("error"); })
    },

    parsePage: function (txt, round = 0) {
        // parse document
        let $doc = $(new DOMParser().parseFromString(txt, "text/html"));

        let err = $doc.find(".error");
        if (err.length != 0) {
            console.log(err);
            let txt = err.first().text();
            throw new Error(txt);
        }

        let board = {
            categories: [],
            questions: [],
            answers: []
        }

        // answer regex pattern
        const ansPat = '<em.*?class="correct_response".*?>(?:<i>)*(.+?)(?:<\/i>)*<\/em>'
        let reAns = new RegExp(ansPat);

        // get jeopardy or double jeopardy tables
        let table;
        if (round == 0) {
            table = $doc.find("#jeopardy_round table.round");
        } else {
            table = $doc.find("#double_jeopardy_round table.round");
        }

        // parse categories
        let categories = table.find(".category_name");
        categories.each(function () {
            board.categories.push(this.innerText);
        });

        table.find(".clue").each(function () {
            // parse question
            let clue = $(this).find(".clue_text").first();
            if (clue) {
                board.questions.push(clue.text());
            } else {
                board.questions.push("");
            }

            // parse answer
            let txt = $(this).find("div").first().attr("onmouseover");
            var match = reAns.exec(txt);
            if (match) {
                board.answers.push(match[1]);
            } else {
                board.answers.push("");
            }
        });

        let data = {
            columns: board.categories.length,
            rows: board.questions.length / board.categories.length,
            categories: board.categories,
            clues: []
        }

        let column = 0;
        let row = 0;
        for (let i = 0; i < board.questions.length; i++) {
            data.clues.push({
                column: column,
                row: row,
                question: board.questions[i],
                answer: board.answers[i]
            })
            column++;
            if ((column) % data.columns == 0) {
                column = 0;
                row++;
            }
        }
        return JSON.stringify(data);
    }
}
