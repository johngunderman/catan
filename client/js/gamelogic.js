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

// no cost if initial build
function insertRoad(user, vertex1, vertex2, isInitialBuild) {
    // make sure there isn't a road there yet
    if (isvalid(vertex1)
        && isvalid(vertex2)
        && !gameboard.roads[vertex1 + "." + vertex2]
        && !gameboard.roads[vertex2 + "." + vertex1]) {

        if (hasRoadResources() || isInitialBuild || user != userID) {
            gameboard.roads[vertex1 + "." + vertex2] = user;

            console.log("Action: road created");
        }

        if (user == userID && hasRoadResources()) {
            removeCityResources();
        }
    }
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

function getValidRoadPlaces() {
    var valid = [];
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 6; y++) {
	    var v1 = [x,y,WEST];
            if(isvalid(v1)) {
                var adj = adjacent(v1);
                for (var z = 0; z < adj.length; z++) {
                    var v2 = adj[z];
                    if (gameboard.settlements[compress(v1)]
                        || gameboard.settlements[compress(v2)]) {
                        valid.push([v1,v2]);
                    }
                }
            }
        }
    }

    return valid;
}
