
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

// The result of the ajax request will json which is then passed to
// the given callback func.
function makeAjaxRequest(url, params, callbackFunc) {
    var xmlhttp;
    xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            callbackFunc(xmlhttp.responseText);
        }
    }

    xmlhttp.open("GET", url + params, true);
    xmlhttp.send();
}


// currently a huge hack, just so we can get the starting board layout.
function startGameRequest() {


    var start_game_callback = function(json) {
        console.log(json);
        var myJson = JSON.parse(json);
        console.log(myJson);

        if (myJson.log[0].action != "hexes_placed") {
            console.log("ERROR: data returned from /start_game is unexpected");
        }
        else {
            var hexes = myJson.log[0].args;

            initBoard(hexes);
        }

    }

    var create_game_callback = function(json) {
        gameID = parseInt(json);
        console.log("created new game with gameID: " + gameID);

        makeAjaxRequest(HOSTNAME + "/start_game",
                        "?user=" + userID
                        + "&game=" + gameID
                        + "&sequence=" + sequenceNum,
                        start_game_callback);
    }

    makeAjaxRequest(HOSTNAME + "/create_game", "?user=" + userID,
                   create_game_callback);
}


function dispChit(context,x,y) {
    var xcoord = 0;
    var ycoord = 0;
    var xy = getPixeCoords(x,y);

    xcoord = xy[0];
    ycoord = xy[1];

    xcoord += SCALE_HEIGHT / 2;
    ycoord += SCALE_WIDTH / 2;

    var radius = 70;

    context.beginPath();
    context.arc(xcoord, ycoord, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "#8ED6FF";
    context.fill();
    context.lineWidth = 5;
    context.strokeStyle = "black";
    context.stroke();
}
