"use strict";

// entries in `settlements` read as follows:
// with key of vertex, value is type of
// { settlement: CITY | SETTLEMENT, user:userID }
function insertSettlement(user, p, type) {
    gameboard.settlements[p] =
    {
        "settlement" : type,
        "user" : user
    };

    drawSettlement(p, gameboard.users[userID].color);
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

function hasSettlementResources() {
    if (gameboard.cards.brick
        && gameboard.cards.lumber
        && gameboard.cards.wool
        && gameboard.cards.grain) {
        return true;
    }
    else return false;
}

function removeRoadResources() {
    gameboard.cards.brick--;
    gameboard.cards.lumber--;
}

function removeCityResources() {
    gameboard.cards.ore -= 3;
    gameboard.cards.grain -= 2;
}

function removeSettlementResources() {
    gameboard.cards.brick--;
    gameboard.cards.lumber--;
    gameboard.cards.wool--;
    gameboard.cards.grain--;
}

function getBadDistanceRule() {
    var excluded = {};

    for (var vertex in gameboard.settlements) {
        vertex = parseInt(vertex);
        excluded[vertex] = true;

        //TODO: the decompress + recompress is somewhat ugly.
        adjacent(decompress(vertex)).forEach(function(v) {
            excluded[compress(v)] = true;
        });
    }

    return excluded;
}


function getValidDistanceRule() {
    var excluded = getBadDistanceRule(); 

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
            var roads = gameboard.roads[i];
            roads.forEach(function(road) {
                var index = [road.vertex1, road.vertex2];
                if(index in valid) {
                    delete valid[index];
                }
            });
    }

    //There may be a utility function to do the below
    var ret = [];

    for(var i in valid) {
        ret.push(valid[i]);
    }

    return ret;
}
