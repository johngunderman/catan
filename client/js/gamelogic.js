"use strict";

// entries in `settlements` read as follows:
// with key of vertex, value is type of
// { settlement: CITY | SETTLEMENT, user:userID }

function insertSettlement(user, uvertex) {
    // make sure we're valid and a settlement doesn't exist
    // at that vertex yet.
    var vertex = compress(uvertex);
    console.log("vertex: " + vertex);
    console.log(gameboard.settlements[vertex]);
    if (isvalid(uvertex) && !gameboard.settlements[vertex]) {
        gameboard.settlements[vertex] =
            {
                "settlement" : SETTLEMENT,
                "user" : user
            };
    }
}

function insertCity(user, vertex) {
    // make sure we're valid and a settlement does exist
    // at that vertex yet.
    if (isvalid(vertex) && gameboard.settlements[vertex]
        && gameboard.settlements[vertex].settlement == SETTLEMENT
        && gameboard.settlements[vertex].user == user) {
        if (hasCityResources()) {
            // gameboard.settlements[vertex] =
            //     {"settlement" : CITY,
            //      "user" : userID};

            if (user == userID) {
                removeCityResources();
            }
        }
    }
}

function insertRoad(user, vertex1, vertex2) {
    if(!gameboard.roads[user]) {
        gameboard.roads[user] = [];
    }

    var road = {
        user : user,
        vertex1: vertex1,
        vertex2: vertex2
    }

    gameboard.roads[user].push(road);

    drawRoad(road);
}


function hasCityResources() {
    if (gameboard.cards.ore > 3 && gameboard.cards.grain > 2) {
        return true;
    }
    else return false;
}

function hasRoadResources() {
    if(gameboard.cards.brick && gameboard.cards.lumber) {
        return true;
    }
    else return false;
}

function removeRoadResources() {
    if (hasRoadResources()) {
        gameboard.cards.brick--;
        gameboard.cards.lumber--;
    }
}

function removeCityResources() {
    if (hasCityResources()) {
        gameboard.cards.ore -= 3;
        gameboard.cards.grain -= 2;
    }
}

function hasSettlementResources() {
    if (gameboard.cards.brick
        && gameboard.cards.lumber
        && gameboard.cards.wool
        && gameboard.cards.grain) {
        return true;
    }
    else return false;
}

function removeSettlementResources() {
    if (hasSettlementResources()) {
        gameboard.cards.brick--;
        gameboard.cards.lumber--;
        gameboard.cards.wool--;
        gameboard.cards.grain--;
    }
}

function getValidSettlementPlaces() {
    var excluded = {};

    for (var vertex in gameboard.settlements) {
        vertex = parseInt(vertex);
        excluded[vertex] = true;

        //TODO: the decompress + recompress is somewhat ugly.
        adjacent(decompress(vertex)).forEach(function(v) {
            excluded[compress(v)] = true;
        });
    }

    return VERTICES.filter(function(vertex) {
        return !(vertex in excluded)
    });
}


// called when we are handling req_setup
function getValidRoadPlacesInitial() {
    var valid = {}

    function getRoadsFromVertex(start) { //Start is compressed

        var start_v = decompress(start);
        console.log(start_v);
        adjacent(start_v).forEach(function(end_v) {
            var end = compress(end_v);

            var from = end > start ? start : end;
            var to = end > start ? end: start;

            valid[[from, to]] = { "from" : parseInt(from),
                                  "to" : parseInt(to) };
        });
    }

    for (var s in  gameboard.settlements) {
        console.log("heroo: " + s);

        if (gameboard.settlements[s].user == userID) {
            getRoadsFromVertex(s);
        }
    }


    console.log( valid);

    return valid;
}


function getValidRoadPlaces() {

    // called most of the time
    function getAdjacentRoads(road) {
        function getRoadsFromVertex(start) { //Start is compressed

            var start_v = decompress(start);
            adjacent(start_v).forEach(function(end_v) {
                var end = compress(end_v);

                var from = end > start ? start : end;
                var to = end > start ? end: start;

                valid[[from, to]] =  { "from" : parseInt(from),
                                       "to" : parseInt(to) };
            });
        }

        [road.vertex1, road.vertex2].forEach(getRoadsFromVertex);
    }

    gameboard.roads[userID].forEach(getAdjacentRoads);

    //remove those which are already held by other players
    for(var i in gameboard.roads) {
        if(i != userID) {
            var roads = gameboard.roads[i];
            roads.forEach(function(road) {
                console.log(road);
                var index = [road.vertex1, road.vertex2];
                if(index in valid) {
                    delete valid[index];
                }
            });
        }
    }

    var ret = [];

    for(var i in valid) {
        ret.push(i);
    }

    return ret;
}
