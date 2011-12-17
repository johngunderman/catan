// All our handlers for action events
// req events are handled seperately, as we only care about them if they
// are on the top of the log. See handleResponseJson().
handlers = {
    "resources_gained"    : handle_resources_gained,
    "hexes_placed"        : handle_hexes_placed,
    "settlement_built"    : handle_settlement_built,
    "settlement_upgraded" : handle_settlement_upgraded
}

req_handlers = {
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

    for (var v in valid) {
        drawRoadDetector(stage, valid[v][0],
                         valid[v][1], isInitial);
    }


}

function handle_resources_gained(log_entry) {

}

function handle_req_setup(log_entry) {
    promptSettlement(true);

//    promptRoad(true);

}

function handle_hexes_placed(log_entry) {
    initBoard(log_entry.args);
}

function handle_settlement_built(log_entry) {
    // TODO: register the settlement build in our global gamestate model
    insertSettlement(log_entry.user, log_entry.vertex);
    drawSettlement(log_entry.user, log_entry.vertex);
}

function handle_settlement_upgraded(log_entry) {

}

function handle_req_turn(log_entry) {

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

    if(myJson.response && myJson.log
       && myJson.sequence && myJson.response == "success") {

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
        if (req_handlers[top.action] && top.user == userID) {
            req_handlers[top.action](top);
        }


    }
    else {
        // stuff is really messed up, so go ahead and reload the page
        //window.location.reload();
    }
}


// currently a huge hack, just so we can get the starting board layout.
function startGameRequest() {

    var create_game_callback = function(json) {
        gameID = parseInt(json);
        console.log("created new game with gameID: " + gameID);

        makeAjaxRequest(HOSTNAME + "/start_game",
                        + "&game=" + gameID
                        + "&sequence=" + sequenceNum,
                        handleResponseJson);
    }

    makeAjaxRequest(HOSTNAME + "/create_game", ""
                   create_game_callback);
}

function makeSetupRequest(sequenceNum, vertex, roadto) {
    makeAjaxRequest(HOSTNAME + "/setup",
                    + "&sequence=" + sequenceNum
                    + "&settlement=" + vertex
                    + "&roadto=" + roadto
                   );
    // clear 'em out!
    actionsMade = [];
}
