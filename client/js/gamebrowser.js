"use strict";

window.onload = function() {
    window.userID = parseInt($.cookie("user"));

    if (!window.userID) {
        nullActionButtons();
        displayLoginPrompt();
    }
}

function nullActionButtons() {

}

function displayLoginPrompt() {
    $(".alert-message").removeClass("invis");
    $(".alert-message").alert();
    $("#login-button").removeClass("invis");
    $("#create-game-button").addClass("invis");
}
