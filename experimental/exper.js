"use strict"
/**
 * @file Experimental Code for testing Ideas
 */

$(document).ready(function(){

    let category_form;
    let trivia_form;
    let category_dialog;
    let trivia_dialog;
    let frm_name_category = $('input[name="frm_name_category"]');
    let frm_name_trivia_question = $('input[name="frm_name_trivia_question"]');
    let frm_name_trivia_answer = $('input[name="frm_name_trivia_answer"]');

    let fill_value = "";
    let num_rows = 5;
    let num_cols = 6;
    let size  = num_rows * num_cols; // number of elements in the game board
    let questions = Array.apply(null,{length: size}).map(function() { return fill_value; });
    let answers = Array.apply(null,{length: size}).map(function() { return fill_value; });
    
    let clicked_trivia_index = 0;
    let tips = $( ".validateTips" );
    
    // keep track of some elements of the table that have been manipulated by the user
    let clicked_col;
    let clicked_row;
    let clicked_element;
    let category_editable = true;
    let trivia_editable = true;

    // set up the edit category dialog
    category_dialog = $( "#category-form" ).dialog({
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
    trivia_dialog = $( "#trivia-form" ).dialog({
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

    function updateTips( t ) {
        tips
            .text( t )
            .addClass( "ui-state-highlight" );
        setTimeout(function() {
            tips.removeClass( "ui-state-highlight", 1500 );
        }, 500 );
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
        valid = valid && checkLength( frm_name_category, "category", 3, 16 );
        valid = valid && checkRegexp( frm_name_category, /^[a-z]([0-9a-z_\s])+$/i, "Input may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );

        // validates the form's input field, and closes the modal
        if ( valid ) {
            clicked_element.target.innerHTML = frm_name_category.val();
            category_dialog.dialog( "close" );
        }
        return valid;
    }

    function editTrivia() {
        let valid = true;
        frm_name_trivia_question.removeClass( "ui-state-error" );
        frm_name_trivia_answer.removeClass( "ui-state-error" );

        valid = valid && checkLength( frm_name_trivia_question, "trivia", 3, 256 );
        valid = valid && checkRegexp( frm_name_trivia_question, /^[a-z]([0-9a-z_\s])+$/i, "Input may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );
        valid = valid && checkLength( frm_name_trivia_answer, "trivia", 3, 256 );
        valid = valid && checkRegexp( frm_name_trivia_answer, /^[a-z]([0-9a-z_\s])+$/i, "Input may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );        

        // validates the form's input field, and closes the modal
        if ( valid ) {
            // store the user's trivia information in the local session table
            questions[clicked_trivia_index] = frm_name_trivia_question.val();
            answers[clicked_trivia_index] = frm_name_trivia_answer.val();

            console.log("Input: \nQuestion: " + questions[clicked_trivia_index] + "\nAnswer: " + answers[clicked_trivia_index]);

            trivia_dialog.dialog( "close" );
        }
        return valid;
    }    

    // make the editable category and trivia fields editable
    $( "#toggle-editable" ).button().on( "click", function() {
        toggleClicks();
        console.log('Toggled Category Status: ' + category_editable);
        console.log('Toggled Trivia Status: ' + trivia_editable);
    });

    // set up the click event for the trivia elements
    $("#triviaTable td").click(function( clicked_object ) {

        clicked_col = parseInt( $(this).index());
        clicked_row = parseInt( $(this).parent().index());        

        clicked_element = clicked_object;
        if ( trivia_editable ) {
            // ensure the form is populated with the current value of the table element before open
            // trivia will extract the current value from the stored (local storage) values depending on the td value read
            
            // var names = [];
            // names[0] = prompt("New member name?");
            // set | localStorage.setItem("names", JSON.stringify(names));
            // get | var storedNames = JSON.parse(localStorage.getItem("names"));
            let output = "Trivia: clicked_row = " + clicked_row + ",  clicked_col = " + clicked_col;
            console.log(output);
            clicked_trivia_index = (clicked_row * 6) + clicked_col;
            // 6 columns
            // 5 rows
            // each row is 6 values
            // so row 3 = index 18 + column

            let question = questions[clicked_trivia_index];
            if (typeof question == 'undefined'){ question = "<empty>"; }
            
            let answer = answers[clicked_trivia_index];
            if (typeof answer == 'undefined'){ answer = "<empty>"; }


            output = "Question[" + clicked_trivia_index + "]: " + question + "\nAnswer[" + clicked_trivia_index + "]: " + answer;
            console.log(output);
            
            frm_name_trivia_question.val(question);
            frm_name_trivia_answer.val(answer);

            trivia_dialog.dialog( "open" );
        }
    });

    // set up the click event for the category elements
    $("#categoryTable td").click(function( clicked_object ) {
        clicked_element = clicked_object;
        if ( category_editable ) {
            // ensure the form is populated with the current value of the table element before open
            frm_name_category.val($(this).text());
            category_dialog.dialog( "open" );
        }
    });
});