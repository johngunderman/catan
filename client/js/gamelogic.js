"use strict";

// entries in `settlements` read as follows:
// with key of vertex, value is type of
// { settlement: CITY | SETTLEMENT, user:userID }
function insertSettlement(user, p, take) {
    var create = gameboard.settlements[p] === undefined;

    gameboard.settlements[p] =
    {
        "settlement" : SETTLEMENT,
        "user" : user
    };

    drawSettlement(p, gameboard.users[user].color);
    
    if(create) {
        gameboard.scores[user] += 1;
        if(take && user == userID) takeSettlementResources();
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

function insertRoad(user, from, to, take) {
    if(!gameboard.roads[user]) {
        gameboard.roads[user] = {};
    }

    var vertex1 = from < to ? from : to;
    var vertex2 = from < to ? to : from;

    var road = {
        user : user,
        vertex1: vertex1,
        vertex2: vertex2
    }

    var index = [vertex1, vertex2]
    var create = gameboard.roads[user][index] === undefined
    gameboard.roads[user][index] = road;

    drawRoad(road);

    if(create && take && user === userID) {
        takeRoadResources();
    }
}

//TODO: Put these in an array
function hasCityResources() {
    return gameboard.cards.ore > 3 && gameboard.cards.grain > 2;
}

function hasRoadResources() {
    return gameboard.cards.brick >= 1 && gameboard.cards.lumber >= 1;
}

function hasSettlementResources() {
    return gameboard.cards.brick >= 1 &&
        gameboard.cards.lumber >= 1 &&
        gameboard.cards.wool >= 1 &&
        gameboard.cards.grain >= 1
}

function takeRoadResources() {
    gameboard.cards.brick--;
    gameboard.cards.lumber--;
    updateResources();
}

function takeCityResources() {
    gameboard.cards.ore -= 3;
    gameboard.cards.grain -= 2;
    updateResources();
}

function takeSettlementResources() {
    gameboard.cards.brick--;
    gameboard.cards.lumber--;
    gameboard.cards.wool--;
    gameboard.cards.grain--;
    updateResources();
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

    for(var i in gameboard.roads[userID]) {
        getAdjacentRoads(gameboard.roads[userID][i]);
    }

    //remove those which are already held by other players
    for(var i in gameboard.roads) {
            var roads = gameboard.roads[i];
            for(var i in roads) {
                if(i in valid) {
                    delete valid[i];
                }
            }
    }

    //There may be a utility function to do the below
    var ret = [];

    for(var i in valid) {
        ret.push(valid[i]);
    }

    return ret;
}
