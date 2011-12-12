
window.onload = function() {
    startGameRequest();

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
    drawAllRoadDetectors(stage);
}

function placeCityClicked() {
    stage.removeAll();
    drawAllCityDetectors(stage);
}

function doneButtonClicked() {
    // here we should tell the server that we're done.
    alert("Your turn is now over!");
}

