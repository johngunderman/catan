"use strict";

// entries in `settlements` read as follows:
// with key of vertex, value is type of
// { settlement: CITY | SETTLEMENT, user:userID }
function insertSettlement(user, uvertex) {
    // make sure we're valid and a settlement doesn't exist
    // at that vertex yet.
    var vertex = compress(uvertex);
    if (isvalid(uvertex) && !gameboard.settlements[vertex]) {
        gameboard.settlements[vertex] =
            {
                "settlement" : SETTLEMENT,
                "user" : user
            };
    }
}

function hex_adjacent(p) {
    var coords = decompress(p);

    var adjacent = [];
    HEX_ADJACENCY.forEach(function(x) {
        var h = [];
        for(var i = 0; i < 3; i++) {
            h.push(coords[i] + x[i]);
        }
        adjacent.push(compress(h));
    });

    return adjacent;
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

function getRoadsFromVertex(start) {
    var start_v = decompress(start);

    var ret = {};
    adjacent(start_v).forEach(function(end_v) {
        var end = compress(end_v);

        //Reorder if necessary
        var vertex1 = end > start ? start : end;
        var vertex2 = end > start ? end: start;

        //This code may require parseInt
        ret[[vertex1, vertex2]] =  { "vertex1" : vertex1, "vertex2" : vertex2 };
    });

    return ret;
}

function getValidRoadPlaces() {
    var valid = {}

    function getAdjacentRoads(road) {    
        $.extend(valid, getRoadsFromVertex(road.vertex1));
        $.extend(valid, getRoadsFromVertex(road.vertex2));
    }

    gameboard.roads[userID].forEach(getAdjacentRoads);

    //remove those which are already held by other players
    for(var i in gameboard.roads) {
        if(i != userID) {
            var roads = gameboard.roads[i];
            roads.forEach(function(road) {
                var index = [road.vertex1, road.vertex2];
                if(index in valid) {
                    delete valid[index];
                }
            });
        }
    }

    //There may be a utility function to do the below
    var ret = [];

    for(var i in valid) {
        ret.push(i);
    }

    return ret;
}
