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
    "road_built"          : handle_road_built,
    "req_turn"            : handle_req_turn
}

var req_handlers = {
    "req_turn"            : do_turn,
    "req_setup"           : do_setup

}

//TODO: Chance this to promptVertex
function promptSettlement(accept) {
    var dfd = $.Deferred();
    
    accept.forEach(function(i) {
        drawSettlementDetector(stage, i). then(settlementChosen);
    });

    function settlementChosen(p) {
        stage.removeAll();
        dfd.resolve(p)
    }

    return dfd.promise();
}

function promptNewSettlement() {
    var o = getValidSettlementPlaces();
    var a = [];
    for(var i in o) {
        a.push(o[i]);
    }

    return promptSettlement(a);
}

//if p is passed, allow only roads from position p
function promptRoad(p) {
    var dfd = $.Deferred();

    var valid;

    if (p) {
        valid = getRoadsFromVertex(p);
    }
    else {
        valid = getValidRoadPlaces();
    }

    for (var i in valid) {
        drawRoadDetector(stage, valid[i]).then(roadChosen);
    }

    function roadChosen(p) {
        stage.removeAll();
        dfd.resolve(p);
    }

    return dfd.promise();
}

function promptUpgradeSettlement() {
    var valid = getValidSettlementUpgrades();

    for (var v in valid) {
        drawCityDetector(starge, valid[v]);
    }
}

function end_turn() {
    $.ajax("/end_turn?game=" + gameID).done(console.log);
}

function handle_joined(log_entry) {
    var user = {};
    user.id = log_entry.user;

    gameboard.scores[user.id] = 0;
    user.color = usercolors.pop();
    gameboard.users[log_entry.user] = user;

    tickerName(user.id, "joined!");
}

function handle_road_built(log_entry) {
    insertRoad(log_entry.user, log_entry.vertex1, log_entry.vertex2);

    tickerName(log_entry.user, "built a road!");
}

function handle_resources_gained(log_entry) {
    var cards = log_entry.cards;

    //Add to cards owned.
    cards.forEach(
        function(card) {
            gameboard.cards[cardNames[card[1]]] += card[0];
        }
    );

    //Put a message in the ticker
    function format_single(card) {
        return card[0] + " " + cardNames[card[1]];
    }

    var message = "got";

    if(cards.length > 0) {
        message += " " + format_single(cards[0]);
    }

    for(var i = 1; i < cards.length - 1; i++) {
        message += ", " + format_single(cards[i]);
    }

    if(cards.length > 1) {
        if(cards.length >= 3) message += ", and";
        else message += " and"

        message += " " + format_single(cards[cards.length - 1]);
    }

    tickerName(log_entry.user, message);
    drawResourceCounters();
}

function do_setup(log_entry) {
    var settlement;

    promptNewSettlement().done(gotSettlement)

    function gotSettlement(p) {
        settlement = p;
        drawSettlement(p, gameboard.users[userID].color);
        promptRoad(p).done(gotRoad);
    }

    function gotRoad(r) {
        r.user = userID;
        drawRoad(r);

        //The roadto is the one that doesn't equal the settlement
        var roadto = r.vertex1 != settlement ? r.vertex1 : r.vertex2
        makeSetupRequest(settlement, roadto);
    }

    function makeSetupRequest(settlement, roadto) {
        makeAjaxRequest("/setup",
                    "?game=" + gameID
                    + "&settlement=" + settlement
                    + "&roadto=" + roadto,
                    function(json) {}
                   );
    }
}

function handle_hexes_placed(log_entry) {
    sendToTicker("Initializing the board...");
    initBoard(log_entry.args);
}

function handle_settlement_built(log_entry) {
    // update score:
    gameboard.scores[log_entry.user] = log_entry.score;

    sendToTicker(name(log_entry.user) + " built a settlement!");
    // TODO: register the settlement build in our global gamestate model
    insertSettlement(log_entry.user, decompress(log_entry.vertex));
    drawSettlement(log_entry.vertex, gameboard.users[log_entry.user].color);
}

function handle_settlement_upgraded(log_entry) {
    sendToTicker(name(log_entry.user) + " upgraded a settlement!");
}

function handle_req_turn(log_entry) {
    tickerName(log_entry.user, "rolled a " + log_entry.roll);
}

function handle_req_setup(log_entry) {
}

function do_turn(log_entry) {
    function move_robber() {
        var robber_dfd = $.Deferred();

        if(log_entry.roll === 7) {
            var moveto;
            var choose_location = promptRobber();
            var choose_steal_from = choose_location.pipe(function(chosen) {
                moveto = chosen;

                var valid = hex_adjacent(chosen).filter(function(h) {
                    return h in gameboard.settlements;
                });

                var dfd = $.Deferred();

                if(valid.length > 1) {
                    promptSettlement(valid).done(dfd.resolve);
                } else if(valid.length === 1) {
                    dfd.resolve(valid[0])
                } else {
                    dfd.resolve(null);
                }

                return dfd.promise();
            })

            choose_steal_from.pipe(function(stealfrom) {
                var data = { game: gameID, moveto: moveto };
                if(stealfrom) {
                    data.stealfrom = stealfrom;
                }
                
                $.get("/move_robber", data);
                robber_dfd.resolve();
            });
        } else {
            robber_dfd.resolve();
        }

        return robber_dfd.promise();
    }


    function send_update_new_settlement(p) {
        insertSettlement(userID, decompress(p));
        //drawSettlement(p);
        $.get(HOSTNAME + "/build_settlement", {"vertex" : p, "game" : gameID});

        // keep giving the option to build, if we can.
        if (hasRoadResources() || hasSettlementResources()) {
            do_build();
        }
    }

    function send_update_new_road(p) {
        insertRoad(userID, p.vertex1, p.vertex2);
        $.get(HOSTNAME + "/build_road", {"vertex1" : p.vertex1, "vertex2" : p.vertex2, "game" : gameID});
    }

    function do_build() {
        var built = false;

        if(hasRoadResources()) {
            console.log("We can build a road!");
            promptRoad().then(send_update_new_road);
            built = true;
        }
        if(hasSettlementResources()) {
            console.log("We can build a Settlement!");
            promptNewSettlement().then(send_update_new_settlement);
            built = true;
        }
        return built;
    }

    move_robber().done(do_build);
}

function promptRobber() {
    var dfd = $.Deferred();

    VALID_HEXES.forEach(function(h) {
        if(h !== gameboard.robber) {
            drawChitDetector(stage, h).done(gotRobber);
        }
    });

    function gotRobber(h) {
        //TODO: Come up with a more-fine grained approach.
        stage.removeAll();
        dfd.resolve(h);
    }

    return dfd.promise();
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

            var last_req = null;
            for(var x = 0; x < myJson.log.length; x++) {
                var log_entry = log[x];
                if (handlers[log_entry.action]) {
                    handlers[log_entry.action](log_entry);
                }

                if(req_handlers[log_entry.action]) {
                    last_req = log_entry;
                }
            }

            if(last_req) {
                updatePlayerDisplay(last_req.user);
                window.currentUserID = last_req.user;

                if(userID === last_req.user) {
                    req_handlers[last_req.action](last_req);
                }
            }

            updateClient();

        }
        else {
            console.log("Malformed json returned");

            setTimeout("updateClient()",3000);
            // stuff is really messed up, so go ahead and reload the page
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
