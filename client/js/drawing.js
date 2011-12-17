"use strict";

// hexes are encoded as [vertex, chit, type]
function dispBoard(img, context, hexes) {

    for (var x = 0; x < hexes.length; x++) {
        var xyd = decompress(hexes[x][0]);

        drawHexAt(img, context, hexes[x][2], xyd[0], xyd[1]);
        dispChit(context, hexes[x][1], xyd[0],xyd[1]);
    }

    drawResourceCounters(context, 1,2,5,4,3);

}


function drawCoords(context) {
    // draw us some coordinates:
    for (var x = -1; x < 7; x++) {
        for (var y = -1; y < 7; y++) {
            dispAtVertex(x + "," + y + ",0", context, x, y, 0);
            dispAtVertex(x + "," + y + ",1", context, x, y, 1);
        }
    }
}


// On the given stage, draw a road detector from the vertice
// described with (x1,y1,d1) to the vertice (x2,y2,d2).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a road at the given line when clicked.
function drawRoadDetector(stage, v1, v2, isInitial) {

    var coords1 = getVertexCoords(v1[0], v1[1], v1[2]);
    var coords2 = getVertexCoords(v2[0], v2[1], v2[2]);
    var context = stage.getContext();

    var line = new Kinetic.Shape(function(){
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "red";
        context.fillStyle = "rgba(0,0,0,0)";
	var width = 2

        // hacky-hack to fix the size of the road detectors
        // I know it's terribad.
        if (coords1[1] > coords2[1]) {
            context.moveTo(coords1[0] - width, coords1[1] - width);
            context.lineTo(coords1[0] + width, coords1[1] + width);
            context.lineTo(coords2[0] + width, coords2[1] + width);
            context.lineTo(coords2[0] - width, coords2[1] - width);
        }
        else if (coords1[1] < coords2[1]) {
            context.moveTo(coords1[0] - width, coords1[1] + width);
            context.lineTo(coords1[0] + width, coords1[1] - width);
            context.lineTo(coords2[0] + width, coords2[1] - width);
            context.lineTo(coords2[0] - width, coords2[1] + width);
        }
        else {
            context.moveTo(coords1[0] - width, coords1[1] - width);
            context.lineTo(coords1[0] + width, coords1[1] + width);
            context.lineTo(coords2[0] + width, coords2[1] + width);
            context.lineTo(coords2[0] - width, coords2[1] - width);

        }



        context.closePath();
	context.fill();
        context.stroke();
    });

    line.addEventListener("mouseover", function(){
        document.body.style.cursor = "pointer";
    });
    line.addEventListener("mouseout", function(){
        document.body.style.cursor = "default";
    });

    line.addEventListener("mousedown", function(){

        if (hasRoadResources() || isInitial) {

            drawRoad(gameboard.users[userID].color, v1, v2);

            insertRoad(userID, v1, v2, isInitial);
            // log this into our actions to send to the server
            actionsMade.push({"action" : "road",
                              "vertex1" : compress(v1),
                              "vertex2" : compress(v2)});


        }

        if (isInitial) {

            var roadto  = -1;

            if (actionsMade[1].vertex1 == actionsMade[0].vertex) {
                roadto = actionsMade[1].vertex2;
            }
            else {
                roadto = actionsMade[1].vertex1;
            }

            makeSetupRequest(actionsMade[0].vertex, roadto);
        }


        stage.removeAll();
    });

    stage.add(line);
}


function drawRoad(road) {
    var v1 = decompress(road.vertex1);
    var v2 = decompress(road.vertex2);
    var color = gameboard.users[road.user].color;

    var coords1 = getVertexCoords(v1[0], v1[1], v1[2]);
    var coords2 = getVertexCoords(v2[0], v2[1], v2[2]);
    var context = stage.getContext();

    document.body.style.cursor = "default";
    context.beginPath();
    context.lineWidth = 6;
    context.strokeStyle = color;
    context.moveTo(coords1[0], coords1[1]);
    context.lineTo(coords2[0], coords2[1]);
    context.closePath();
    context.stroke();
}

// On the given stage, draw a city detector on the vertice
// described with (x1,y1,d1).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a city at the given vertex when clicked.
function drawSettlementDetector(stage, vertex, isInitial) {

    var coords = getVertexCoords(vertex[0], vertex[1], vertex[2]);
    var context = stage.getContext();

    var city = new Kinetic.Shape(function(){
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "red"
        context.fillStyle = "rgba(0,0,0,0)";
	var width = 5

        context.moveTo(coords[0] - width, coords[1] - width);
        context.lineTo(coords[0] - width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] - width);
        context.closePath();
	context.fill();
        context.stroke();
    });

    city.addEventListener("mouseover", function(){
        document.body.style.cursor = "pointer";
    });
    city.addEventListener("mouseout", function(){
        document.body.style.cursor = "default";
    });

    city.addEventListener("mousedown", function(){

        if (isInitial || hasSettlementResources()) {
            insertSettlement(userID, vertex, isInitial);

            // record this action in our list of overall actions
            actionsMade.push({"item" : "settlement", "vertex" : compress(vertex)});
            drawSettlement(gameboard.users[userID].color, vertex);
        } else {
            console.log("Not enough resources");
        }


        if (isInitial) {
            promptRoad(isInitial);
        }
    });

    stage.add(city);
}


// user id determines the color
function drawSettlement(color, vertex) {

    var coords = getVertexCoords(vertex[0], vertex[1], vertex[2]);
    var context = stage.getContext();

    var width = 6;
    document.body.style.cursor = "default";
    context.beginPath();
    context.fillStyle = color;
    context.moveTo(coords[0] - width, coords[1] - width);
    context.lineTo(coords[0] - width, coords[1] + width);
    context.lineTo(coords[0] + width, coords[1] + width);
    context.lineTo(coords[0] + width, coords[1] - width);

    context.closePath();
    context.fill();

    stage.removeAll();

}

// x,y determines a hex, d determines the vertex of the hex
// Two values for d: WEST or NORTHWEST
function dispAtVertex(text, context, x, y, d) {
    var xcoord = 0;
    var ycoord = 0;

    var coords = getVertexCoords(x,y,d);
    xcoord = coords[0];
    ycoord = coords[1];


    context.fillStyle    = 'rgb(0,0,0)';
    context.font         = '12px sans-serif';
    context.fillText(text, xcoord, ycoord);
}


// gives the pixel coordinates of the upper left hand corner
// of the square containing the hexagon to be drawn. Note that this pixel
// location is not actually inside the hexagon.
function getPixelCoords(x,y) {
    var xcoord = 0;
    var ycoord = 0;

    ycoord = 0.5 * (3 - x) * SCALE_HEIGHT + y * SCALE_HEIGHT;

    xcoord = (SCALE_WIDTH - SCALE_OFFSET) * x;

    ycoord += .5 * SCALE_HEIGHT;
    xcoord += SCALE_WIDTH - SCALE_OFFSET;

    return [xcoord, ycoord];
}

function getVertexCoords(x,y,d) {
    var xcoord;
    var ycoord;

    var coords = getPixelCoords(x,y);
    xcoord = coords[0];
    ycoord = coords[1];

    if (d == WEST) {
        ycoord += .5 * SCALE_HEIGHT;
    }
    else if (d == NORTHWEST) {
        xcoord += SCALE_OFFSET;
    }

    return [xcoord, ycoord];
}


function dispWaterFrame(img, context) {

    drawHexAt(img, context, OCEAN, -1,-1);
    drawHexAt(img, context, OCEAN, -1,0);
    drawHexAt(img, context, OCEAN, -1,1);
    drawHexAt(img, context, OCEAN, -1,2);

    drawHexAt(img, context, OCEAN, 0,-1);
    drawHexAt(img, context, OCEAN, 0,3);

    drawHexAt(img, context, OCEAN, 1,-1);
    drawHexAt(img, context, OCEAN, 1,4);

    drawHexAt(img, context, OCEAN, 2,-1);
    drawHexAt(img, context, OCEAN, 2,5);

    drawHexAt(img, context, OCEAN, 3,0);
    drawHexAt(img, context, OCEAN, 3,5);

    drawHexAt(img, context, OCEAN, 4,1);
    drawHexAt(img, context, OCEAN, 4,5);

    drawHexAt(img, context, OCEAN, 5,2);
    drawHexAt(img, context, OCEAN, 5,3);
    drawHexAt(img, context, OCEAN, 5,4);
    drawHexAt(img, context, OCEAN, 5,5);

}


// (0,0) is measured as the north-west most piece on the board.
// TODO: Make this not draw things in the lower right hand corner
function drawHexAt(img, context, hexNum, x, y) {
    var xcoord = 0;
    var ycoord = 0;

    var coords = getPixelCoords(x,y);
    xcoord = coords[0];
    ycoord = coords[1];

    context.drawImage(img, 0, TILE_HEIGHT * hexNum,
                      TILE_WIDTH, TILE_HEIGHT,
                      xcoord, ycoord,
                      SCALE_WIDTH, SCALE_HEIGHT);
}

function initTicker() {
    // Init ticker
    var canvas = document.getElementById('ticker');

    window.tickerContext = canvas.getContext('2d');
    tickerContext.clearRect(0, 0, canvas.width, canvas.height);

    tickerContext.fillStyle = "rgb(49,79,79)";
    tickerContext.font    = 'bold 12px sans-serif';
}

function sendToTicker(message) {
    tickerLog.push(message);

    var canvas = document.getElementById('ticker');
    tickerContext.clearRect(0, 0, canvas.width, canvas.height);

    if (tickerLog.length > TICKER_LENGTH) {
        TICKER_BASE =  TICKER_BASE -  TICKER_INC;
    }

    for(var x = 0; x < tickerLog.length; x++) {
        tickerContext.fillText(tickerLog[x],
                               TICKER_XOFFSET, TICKER_BASE + x * TICKER_INC);
    }

}

function initWhitespace(user) {
    var example = document.getElementById('whitespace');
    var context = example.getContext('2d');

    if (user == userID) {
        // init whitespace

        context.fillStyle = "rgb(34,139,34)";
        context.beginPath();
        context.arc(40, 43, 10, 0, Math.PI*2, true);
        context.closePath();
        context.fill();
        context.font    = 'bold 20px sans-serif';
        context.fillText  ("It's your turn!", 70, 50);
        //context.fillText  ("1:37", 180, 105);
    } else {
        context.clearRect(0,0,250,130);
    }
}


function updatePlayerDisplay(user) {

    initWhitespace(user);

    console.log(gameboard.users);

    var canvas = document.getElementById('players');

    var context = canvas.getContext('2d');

    context.clearRect(0, 0, canvas.width, canvas.height);

    var i = 1;

    for (var v in gameboard.users) {


        if (user.toString() == v) {
            context.fillStyle = "rgb(34,139,34)";
            context.beginPath();
            context.arc(60, PLAYER_DISPLAY_OFFSET * (i - .2), 7, 0, Math.PI*2, true);
            context.closePath();
            context.fill();
            //context.fillText(">>", 50, PLAYER_DISPLAY_OFFSET * i);
        }

        context.font = 'bold 15px sans-serif';
        context.fillStyle = gameboard.users[v].color;

        if (v == userID.toString()) {
            context.fillText("You",
                             80, PLAYER_DISPLAY_OFFSET * i);
        } else {
            context.fillText("Player " + v,
                             80, PLAYER_DISPLAY_OFFSET * i);
        }

        context.fillStyle = "black";

        context.fillText("(" + gameboard.scores[v] + ")",
                         160, PLAYER_DISPLAY_OFFSET * i);
        i++;
    }

}

function initPlayerDisplay() {
    // init playersDisplay

}

function dispChit(context, number, x,y) {
    var xcoord = 0;
    var ycoord = 0;
    var xy = getPixelCoords(x,y);

    xcoord = xy[0];
    ycoord = xy[1];

    xcoord += SCALE_HEIGHT / 2 + TEXT_XOFFSET;
    ycoord += SCALE_WIDTH / 2 + TEXT_YOFFSET;

    context.beginPath();
    context.arc(xcoord, ycoord, CHIT_RADIUS, 0, 2 * Math.PI, false);

    if (number == 7) {
        context.fillStyle = CHIT_ROBBER_COLOR;
    }
    else {
        context.fillStyle = CHIT_DEFAULT_COLOR;
    }

    context.fill();
    //context.stroke();

    context.beginPath();
    context.arc(xcoord, ycoord, CHIT_RADIUS, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = CHIT_DEFAULT_RIM_COLOR;
    context.stroke();

    context.beginPath();
    context.arc(xcoord, ycoord, CHIT_RADIUS - 3, 0, 2 * Math.PI, false);
    if (number == 6 || number == 8) {
        context.strokeStyle = CHIT_HIGH_PROB_COLOR;
    }
    else if (number == 2 || number == 12) {
        context.strokeStyle = CHIT_LOW_PROB_COLOR;
    }
    else context.strokeStyle = CHIT_DEFAULT_PROB_COLOR;

    context.lineWidth = 3;

    context.stroke();


    context.font = CHIT_FONT;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = CHIT_FONT_COLOR;

    var offset = TEXT_DD_OFFSET * (number > 9);

    if (number != 7)
        context.fillText("" + number, xcoord + offset, ycoord);
}


function drawResourceCounters(context, brick, lumber, wool, grain, ore) {
    context.font = RESOURCE_FONT;
    context.fillStyle = RESOURCE_FONT_COLOR;

    // brick
    context.textAlign = "right";
    context.fillText("" + brick, RESOURCE_XCOORD, RESOURCE_YCOORD);

    context.textAlign = "left";
    context.fillText("Brick", RESOURCE_XCOORD + RESOURCE_TEXT_OFFSET, RESOURCE_YCOORD);

    // lumber
    context.textAlign = "right";
    context.fillText("" + lumber, RESOURCE_XCOORD, RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING);

    context.textAlign = "left";
    context.fillText("Lumber", RESOURCE_XCOORD + RESOURCE_TEXT_OFFSET,
                     RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING );

    // wool
    context.textAlign = "right";
    context.fillText("" + wool, RESOURCE_XCOORD, RESOURCE_YCOORD  + RESOURCE_VERTICAL_SPACING * 2);

    context.textAlign = "left";
    context.fillText("Wool", RESOURCE_XCOORD + RESOURCE_TEXT_OFFSET,
                     RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING * 2);

    // grain
    context.textAlign = "right";
    context.fillText("" + grain, RESOURCE_XCOORD, RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING * 3);

    context.textAlign = "left";
    context.fillText("Grain", RESOURCE_XCOORD + RESOURCE_TEXT_OFFSET,
                     RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING * 3);

    // ore
    context.textAlign = "right";
    context.fillText("" + ore, RESOURCE_XCOORD, RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING * 4);

    context.textAlign = "left";
    context.fillText("Ore", RESOURCE_XCOORD + RESOURCE_TEXT_OFFSET,
                     RESOURCE_YCOORD + RESOURCE_VERTICAL_SPACING * 4);
}
