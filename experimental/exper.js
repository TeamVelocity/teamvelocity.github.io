"use strict"
/**
 * @file Experimental Code for testing Ideas
 */

$(document).ready(function(){

    let dialog;
    let form;

    // From http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#e-mail-state-%28type=email%29
    let emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    category = $( "#category" ),
    allFields = $( [] ).add( category ),
    tips = $( ".validateTips" );    

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
            updateTips( "Length of " + n + " must be between " +
            min + " and " + max + "." );
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
        } else {
            return true;
        }
    }

    function toggleClicks() {
        if (editable){
            editable = false;
        }
        else{
            editable = true;
        }
    }

    function editCategory() {
        let valid = true;
        allFields.removeClass( "ui-state-error" );

        valid = valid && checkLength( category, "category", 3, 16 );
        valid = valid && checkRegexp( category, /^[a-z]([0-9a-z_\s])+$/i, "Category may consist of a-z, 0-9, underscores, spaces and must begin with a letter." );

        if ( valid ) {
            // add the value to the table
            $('.replaceme').text(category.val());

            // close the dialog
            dialog.dialog( "close" );
        }
        return valid;
    }

    // set up the edit category dialog
    dialog = $( "#dialog-form" ).dialog({
    autoOpen: false,
    height: 400,
    width: 350,
    modal: true,
    buttons: {
        "Edit Category": editCategory,
        Cancel: function() {
            dialog.dialog( "close" );
        }
    },
    close: function() {
        form[ 0 ].reset();
        allFields.removeClass( "ui-state-error" );
    }
    });

    // enable the button click event for toggling editability
    form = dialog.find( "form" ).on( "submit", function( event ) {
        event.preventDefault();       
      });
   
    $( "#edit-category" ).button().on( "click", function() {
        toggleClicks();
        console.log('Toggled Status: ' + editable);
    });

    let editable = true;
    // set the event handler for the row
    $(".replaceme").click(function( click_element ){
        if (editable){
            console.log("Clicked on row:" + click_element.target.innerHTML);
            dialog.dialog( "open" );
        }
    });
});