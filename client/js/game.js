
window.onload = function() {

    handleGameJoin();

    initTicker();
    initWhitespace();
    initPlayerDisplay();
}

function initBoard(hexes) {
    // Init the drawing board

    //global
    stage = new Kinetic.Stage("board", BOARD_SIZE, BOARD_SIZE);

    var img = new Image();
    img.onload = function() {
        dispWaterFrame(img, stage.getContext());
        dispBoard(img, stage.getContext(), hexes);
    }

    //onload, then src.  Not the other way around
    img.src = IMAGE_SOURCE;

}


function placeRoadClicked() {
    stage.removeAll();
    promptRoad();
}

function placeCityClicked() {
    stage.removeAll();
    promptSettlement();
}

function doneButtonClicked() {
    // here we should tell the server that we're done.
    alert("Your turn is now over!");
}


function handleGameJoin() {

    var game = window.location.hash.substr(1);

    if (game) {
        gameID = game;
        startGameLog();
    }
    else {
        startGameRequest();
    }
}