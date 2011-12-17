"use strict";

// All our handlers for action events
// req events are handled seperately, as we only care about them if they
// are on the top of the log. See handleResponseJson().
var handlers = {
    "joined"              : handle_joined,
    "resources_gained"    : handle_resources_gained,
    "hexes_placed"        : handle_hexes_placed,
    "settlement_built"    : handle_settlement_built,
    "settlement_upgraded" : handle_settlement_upgraded,
    "road_built"          : handle_road_built
}

var req_handlers = {
    "req_turn"            : handle_req_turn,
    "req_setup"           : handle_req_setup
}


function promptSettlement(isInitial) {

    var valid = getValidSettlementPlaces();

    for (var x in valid) {
        drawSettlementDetector(stage, decompress(valid[x]), true);
    }
}

function promptRoad(isInitial) {

    var valid = getValidRoadPlaces();

    console.log("valid roads " + valid);

    for (var v in valid) {
        drawRoadDetector(stage, valid[v][0],
                         valid[v][1], isInitial);
    }
}

function handle_joined(log_entry) {
    var user = {};
    user.id = log_entry.user

    gameboard.scores[user.id] = 0;
    user.color = usercolors.pop();
    gameboard.users[log_entry.user] = user;
    if (user.id != userID) {
        sendToTicker("Player " + user.id  + " joined!");
    }
    else {
        sendToTicker("You joined game #" + gameID);
    }
}

function handle_road_built(log_entry) {

    sendToTicker("Player " + log_entry.user + " built a road!");
    insertRoad(log_entry.user, decompress(log_entry.vertex1),
               decompress(log_entry.vertex2));

    drawRoad(gameboard.users[log_entry.user].color, decompress(log_entry.vertex1),
               decompress(log_entry.vertex2));
}

function handle_resources_gained(log_entry) {
    var message = "Player " + log_entry.user;
    if(log_entry.user == userID)
    {
        message = "You";
    }

    function format_single(card) {
        return card[0] + " " + cardNames[card[1]];
    }

    message += " got";

    var cards = log_entry.cards;
    for(var i = 0; i < cards.length - 1; i++) {
        message += ", " + format_single(cards[i]);
    }

    if(cards.length > 0) {
        if(cards.length > 2) message += ", and";
        else if(cards.length > 1) message += " and"

        message += " " + format_single(cards[cards.length - 1]);
    }

    sendToTicker(message);
}

function handle_req_setup(log_entry) {
    sendToTicker("It's your turn!");
    promptSettlement(true);
    // this calls promptRoad(true) inside.
    // needs to be changed at some point
}

function handle_hexes_placed(log_entry) {
    sendToTicker("Initializing the board...");
    initBoard(log_entry.args);
}

function handle_settlement_built(log_entry) {

    // update score:
    gameboard.scores[log_entry.user] = log_entry.score;

    sendToTicker("Player " + log_entry.user + " built a settlement!");
    // TODO: register the settlement build in our global gamestate model
    insertSettlement(log_entry.user, decompress(log_entry.vertex));
    drawSettlement(gameboard.users[log_entry.user].color,
            decompress(log_entry.vertex));
}

function handle_settlement_upgraded(log_entry) {
    sendToTicker("Player " + log_entry.user + " upgraded a settlement!");

}

function handle_req_turn(log_entry) {
    sendToTicker("It's your turn!");

}



// The result of the ajax request will json which is then passed to
// the given callback func.
function makeAjaxRequest(url, params, callbackFunc) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {

            console.log("Server Response: " + xmlhttp.responseText);

            callbackFunc(xmlhttp.responseText);
        }
    }

    console.log("Client Request: " + url + params);
    xmlhttp.open("GET", url + params, true);
    xmlhttp.send();
}


function handleResponseJson(json) {
    var myJson = JSON.parse(json);


    window.img = new Image();
    img.onload = function() {


        if(myJson.log && myJson.sequence && myJson.log.length > 0) {

            // update our sequence number
            sequenceNum = myJson.sequence;

            // take care of everything else
            var log = myJson.log;

            for(var x = 0; x < myJson.log.length; x++) {
                if (handlers[log[x].action]) {
                    handlers[log[x].action](log[x]);
                }
            }

            var top = myJson.log[myJson.log.length - 1];

            // handle req_handlers if need be
            if (req_handlers[top.action]) {

                updatePlayerDisplay(top.user);

                if (top.user == userID) {
                    req_handlers[top.action](top);
                }
            }

            updateClient();

        }
        else {
            console.log("Malformed json returned");

            setTimeout("updateClient()",3000);
            // stuff is really messed up, so go ahead and reload the page
            //window.location.reload();
        }

    }

    img.src = IMAGE_SOURCE;


}

function joinGame() {
    makeAjaxRequest(HOSTNAME + "/join_game", "?game=" + gameID,
                    function(json) {updateClient();});

}


function updateClient() {
    makeAjaxRequest(HOSTNAME + "/get_log",
                    "?sequence=" + sequenceNum
                    + "&game=" + gameID,
                    handleResponseJson);
}

// currently a huge hack, just so we can get the starting board layout.
function startGameRequest() {

    var create_game_callback = function(json) {
        window.gameID = parseInt(json);
        console.log("created new game with gameID: " + gameID);
        sendToTicker("New game created!");
        sendToTicker("Waiting for players...");

        window.location = HOSTNAME + "/#" + gameID;

        updateClient();
    }

    makeAjaxRequest(HOSTNAME + "/create_game", "",
                   create_game_callback);
}


function makeSetupRequest(vertex, roadto) {
    makeAjaxRequest(HOSTNAME + "/setup",
                    "?game=" + gameID
                    + "&settlement=" + vertex
                    + "&roadto=" + roadto,
                    function(json) {}
                   );
    // clear 'em out!
    actionsMade = [];
}
