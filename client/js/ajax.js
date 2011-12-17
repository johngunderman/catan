// All our handlers for action events
// req events are handled seperately, as we only care about them if they
// are on the top of the log. See handleResponseJson().
handlers = {
    "resources_gained"    : handle_resources_gained,
    "hexes_placed"        : handle_hexes_placed,
    "settlement_built"    : handle_settlement_built,
    "settlement_upgraded" : handle_settlement_upgraded,
    "road_built"          : handle_road_built
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

function handle_road_built(log_entry) {
    console.log("log reports road built");
    insertRoad(log_entry.user, decompress(log_entry.vertex1),
               decompress(log_entry.vertex2));

    drawRoad(log_entry.user, decompress(log_entry.vertex1),
               decompress(log_entry.vertex2));
}

function handle_resources_gained(log_entry) {

}

function handle_req_setup(log_entry) {
    promptSettlement(true);
    // this calls promptRoad(true) inside.
    // needs to be changed at some point
}

function handle_hexes_placed(log_entry) {
    initBoard(log_entry.args);
}

function handle_settlement_built(log_entry) {
    console.log("log reports settlement built");
    // TODO: register the settlement build in our global gamestate model
    insertSettlement(log_entry.user, decompress(log_entry.vertex));
    drawSettlement(log_entry.user, decompress(log_entry.vertex));
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


    img = new Image();
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
            if (req_handlers[top.action] && top.user == userID) {
                req_handlers[top.action](top);
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
        gameID = parseInt(json);
        console.log("created new game with gameID: " + gameID);

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
                    + "&roadto=" + roadto
                   );
    // clear 'em out!
    actionsMade = [];
}
