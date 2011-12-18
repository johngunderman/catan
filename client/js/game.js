"use strict";

window.onload = function() {
    window.userID = parseInt($.cookie("user"));
    console.debug(userID);

    waitOnImage(handleGameJoin)
            initWhitespace();
            initPlayerDisplay();
}

function user(i) {
    document.cookie = "user=" + i;
    window.location.reload();
}

function next() {
    user(currentUserID);
}


function waitOnImage(func) {

    var img = new Image();
    img.onload = function() {
        func();
    }

    img.src = IMAGE_SOURCE;
}

function initBoard(hexes) {
    window.stage = new Kinetic.Stage("board", BOARD_SIZE, BOARD_SIZE);

    dispWaterFrame(img, stage.getContext());
    dispBoard(img, stage.getContext(), hexes);

    for(var i = 0; i < hexes.length; i++) {
        //Store the robber position
        if(hexes[i][2] == DESERT) {
            gameboard.robber = hexes[i][0];
        }
    }
}


function upgradeSettlements() {
    stage.removeAll();
    promptUpgradeSettlement();
}

function doneButtonClicked() {
    // here we should tell the server that we're done.
    end_turn();
}

function name(user) {
    return user == userID ? "You" : ("Player " + user);
}

function tickerName(user, message) {
    sendToTicker(name(user) + " " + message);
}

function sendToTicker(message) {
    $("#ticker").append("<li> " + message + "</li>");
}




function handleGameJoin() {

    var game = window.location.hash.substr(1);

    if (game) {
        window.gameID = game;
        joinGame();
    }
    else {
        startGameRequest();
    }
}
