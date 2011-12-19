"use strict";

window.onload = function() {
    window.userID = parseInt($.cookie("user"));

    waitOnImage(handleGameJoin);
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
    $("#done").hide(1000)
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

function initResources() {
    var cards = $("#resources");
    
    for(var i in gameboard.cards) {
        cards.append("<span id='" + i + "'>" + gameboard.cards[i] + "</span> " + i + "<br />");
    }
}

function updateResources() {
    for(var i in gameboard.cards) {
        $("#resources #" + i).text(gameboard.cards[i]);
    }
}

function handleGameJoin() {

    var game = window.location.hash.substr(1);

    if (game) {
        window.gameID = game;
        joinGame();
        initResources();
    }
    else {
        startGameRequest();
    }
}
