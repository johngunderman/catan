
// entries in `settlements` read as follows:
// with key of vertex, value is type of
// { settlement: CITY | SETTLEMENT, user:userID }

// no cost if initial build
function insertSettlement(user, vertex, isInitialBuild) {
    // make sure we're valid and a settlement doesn't exist
    // at that vertex yet.
    if (isvalid(vertex) && !gameboard.settlements[vertex]) {
        if (hasSettlementResources() || isInitialBuild) {
            gameboard.settlements[vertex] =
                {"settlement" : SETTLEMENT,
                 "user" : userID};
        }
        if (!isInitialBuild && user == userID) {
            removeSettlementResources();
        }
    }
}

function insertCity(user, vertex) {
    // make sure we're valid and a settlement does exist
    // at that vertex yet.
    if (isvalid(vertex) && gameboard.settlements[vertex]
        && gameboard.settlements[vertex].settlement == SETTLEMENT
        && gameboard.settlements[vertex].user == user) {
        if (hasCityResources()) {
            gameboard.settlements[vertex] =
                {"settlement" : CITY,
                 "user" : userID};

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
        && isvalid(vartex2)
        && !gameboard.settlements[vertex1 + "." + vertex2]
        && !gameboard.settlements[vertex2 + "." + vertex1]) {

        if (hasRoadResources() || isInitialBuild) {
            gameboard.roads[vertex1 + "." + vertex2] = user;
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

    var vertices = [];
    var res = [];

    for (var vertex in gameboard.settlements) {
        vertices.push(vertex);

        var av = adjacent(vertex);
        for(var v in av) {
            vertices.push(av[v]);
        }

    }

    res =  VERTICES.filter(function(vertex) {
        return vertices.indexOf(vertex) <= -1;
    });


    console.log(res);
    return res;
}