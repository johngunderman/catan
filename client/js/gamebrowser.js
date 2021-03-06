"use strict";

window.onload = function() {
    window.userID = parseInt($.cookie("user"));

    if (!window.userID) {
        nullActionButtons();
        displayLoginPrompt();
    }
}

function nullActionButtons() {
    $(".success").addClass("disabled");
}

function displayLoginPrompt() {
    $(".alert-message").removeClass("invis");
    $(".alert-message").alert();
    $("#login-button").removeClass("invis");
    $("#create-game-button").addClass("invis");
}

function login() {
    $.get('/login', function(data) {
        if (data == "success") {
            document.location.reload();
        }
    }, 'text');
}