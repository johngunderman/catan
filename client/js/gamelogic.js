
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
            // record our action so we can push it up to the server
            console.log("Action: Settlement created");
            actionsMade.push({"item" : "settlement", "vertex" : compress(vertex)});
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
        && isvalid(vertex2)
        && !gameboard.roads[vertex1 + "." + vertex2]
        && !gameboard.roads[vertex2 + "." + vertex1]) {

        if (hasRoadResources() || isInitialBuild) {
            gameboard.roads[vertex1 + "." + vertex2] = user;

            console.log("Action: road created");
            actionsMade.push({"action" : "road",
                              "vertex1" : compress(vertex1),
                              "vertex2" : compress(vertex2)});
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

function getValidRoadPlaces() {

    var valid = [];
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 6; y++) {
	    var v1 = [x,y,WEST];
            if(isvalid(v1)) {
                var adj = adjacent(v1);
                for (var z = 0; z < adj.length; z++) {
                    var v2 = adj[z];
                    if (gameboard.settlements[v1] || gameboard.settlements[v2]) {
                        valid.push([v1,v2]);
                    }
                }
            }
        }
    }

    console.log(valid);
    return valid;
}