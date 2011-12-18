"use strict";

window.onload = function() {

    //TODO: Move this somewhere else, maybe?
    window.userID = $.cookie("user");
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

}


function upgradeSettlements() {
    stage.removeAll();
    promptUpgradeSettlement();
}

function doneButtonClicked() {
    // here we should tell the server that we're done.
    alert("Your turn is now over!");
}

function tickerAction(user, message) {

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
