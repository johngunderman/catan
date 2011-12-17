
window.onload = function() {

    userID = $.cookie("user");
    console.debug(userID);

    waitOnImage(handleGameJoin)
            initTicker();
            initWhitespace();
            initPlayerDisplay();
}

function user(i) {
    document.cookie = "user=" + i;
    window.location.reload();
}


function waitOnImage(func) {

    var img = new Image();
    img.onload = function() {
        func();
    }

    img.src = IMAGE_SOURCE;
}

function initBoard(hexes) {

    stage = new Kinetic.Stage("board", BOARD_SIZE, BOARD_SIZE);

    dispWaterFrame(img, stage.getContext());
    dispBoard(img, stage.getContext(), hexes);

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
        joinGame();
    }
    else {
        startGameRequest();
    }
}
