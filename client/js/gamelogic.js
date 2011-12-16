
// entries in `settlements` read as follows:
// with key of vertex, value is type of settlement: CITY | SETTLEMENT

// no cost if initial build
function insertSettlement(user, vertex, isInitialBuild) {
    // make sure we're valid and a settlement doesn't exist
    // at that vertex yet.
    if (isvalid(vertex) && !gameboard.settlements[vertex]) {
        if (hasSettlementResources() || isInitialBuild) {
            gameboard.settlements[vertex] = SETTLEMENT;
        }
    }
}

function insertCity(user, vertex) {
    // make sure we're valid and a settlement does exist
    // at that vertex yet.
    if (isvalid(vertex) && gameboard.settlements[vertex] == SETTLEMENT) {
        if (hasCityResources()) {
            removeCityResources();
            gameboard.settlements[vertex] = CITY;
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
            gameboard.roads[vertex1 + "." + vertex2] = true;
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