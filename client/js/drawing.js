"use strict";

function addClickableEL(o) {
    o.addEventListener("mouseover", function(){
        document.body.style.cursor = "pointer";
    });
    o.addEventListener("mouseout", function(){
        document.body.style.cursor = "default";
    });

}

// hexes are encoded as [vertex, chit, type]
function dispBoard(img, context, hexes) {
    for (var x = 0; x < hexes.length; x++) {
        var xyd = decompress(hexes[x][0]);

        drawHexAt(img, context, hexes[x][2], xyd[0], xyd[1]);
        dispChit(context, hexes[x][1], hexes[x][0]);
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
// described with (x1,y1,d1) to the vertex (x2,y2,d2).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a road at the given line when clicked.
function drawRoadDetector(stage, road) {
    var coords1 = getVertexCoords(road.vertex1);
    var coords2 = getVertexCoords(road.vertex2);
    var context = stage.getContext();

    var shape = new Kinetic.Shape(function(){
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = DETECTOR_COLOR;
        var WIDTH = .05;
        var BUFFER = .10;

        var xlen = coords2[0] - coords1[0];
        var ylen = coords2[1] - coords1[1];

        var xwidth = WIDTH * ylen;
        var ywidth = WIDTH * -xlen;

        var xstart = coords1[0] + BUFFER * xlen;
        var ystart = coords1[1] + BUFFER * ylen;
        
        xlen *= (1 - 2 * BUFFER);
        ylen *= (1 - 2 * BUFFER);

        context.moveTo(xstart - xwidth, ystart - ywidth);
        context.lineTo(xstart + xlen - xwidth, ystart + ylen - ywidth);
        context.lineTo(xstart + xlen + xwidth, ystart + ylen + ywidth);
        context.lineTo(xstart + xwidth, ystart + ywidth);
        context.closePath();

        context.stroke();
    });

    addClickableEL(shape);
    
    var dfd = $.Deferred();
    shape.addEventListener("mousedown", function(){
        dfd.resolve(road); 
    });

    stage.add(shape);

    return dfd.promise();
}


function drawRoad(road) {
    var coords1 = getVertexCoords(road.vertex1);
    var coords2 = getVertexCoords(road.vertex2);
    var context = stage.getContext();

    document.body.style.cursor = "default";
    context.beginPath();
    context.lineWidth = 6;
    context.strokeStyle = gameboard.users[road.user].color;
    context.moveTo(coords1[0], coords1[1]);
    context.lineTo(coords2[0], coords2[1]);
    context.closePath();
    context.stroke();
}


// On the given stage, draw a city detector on the vertex
// described with (x1,y1,d1).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a city at the given vertex when clicked.
function drawCityDetector(stage, vertex, isInitial) {
    var coords = getVertexCoords(vertex);
    var context = stage.getContext();

    var city = new Kinetic.Shape(function(){
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "red"
        context.fillStyle = "rgba(0,0,0,0)";
	var width = 10

        context.moveTo(coords[0] - width, coords[1] - width);
        context.lineTo(coords[0] - width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] - width);
        context.closePath();
	context.fill();
        context.stroke();
    });

    addClickableEL(city);

    city.addEventListener("mousedown", function(){
    });

    stage.add(city);
}

//TODO: just pass in a settlement object
function drawSettlement(p, color) {
    var coords = getVertexCoords(p);
    var context = stage.getContext();

    var width = 10;
    document.body.style.cursor = "default";
    context.beginPath();
    context.fillStyle = color;
    context.moveTo(coords[0] - width, coords[1] - width);
    context.lineTo(coords[0] - width, coords[1] + width);
    context.lineTo(coords[0] + width, coords[1] + width);
    context.lineTo(coords[0] + width, coords[1] - width);

    context.closePath();
    context.fill();

}

// On the given stage, draw a city detector on the vertex
// described with (x1,y1,d1).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a city at the given vertex when clicked.
function drawSettlementDetector(stage, p) {
    var coords = getVertexCoords(p);
    var context = stage.getContext();

    var shape = new Kinetic.Shape(function(){
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = DETECTOR_COLOR;
        context.fillStyle = "rgba(0,0,0,0)";
	
        var width = 5

        context.moveTo(coords[0] - width, coords[1] - width);
        context.lineTo(coords[0] - width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] - width);
        context.closePath();
        context.stroke();
    });

    var dfd = $.Deferred();

    addClickableEL(shape);
    
    shape.addEventListener("mousedown", function(){
        dfd.resolve(p);
    });

    stage.add(shape);

    return dfd.promise();
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

function getVertexCoords(p) {
    var v = decompress(p);
    var x = v[0];
    var y = v[1];
    var d = v[2];

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

function drawChitDetector(stage, hex) {
    var xy = getChitCoords(hex);
    var context = stage.getContext();

    var shape = new Kinetic.Shape(function() {
        var context = this.getContext();
        context.beginPath();
        context.lineWidth = 2;
        context.strokeStyle = DETECTOR_COLOR
        
        context.arc(xy[0], xy[1], 1.5 * CHIT_RADIUS, 0, 2 * Math.PI, false);
        context.closePath();

        context.stroke();
    });

    addClickableEL(shape);

    var dfd = $.Deferred();
    shape.addEventListener("mousedown", function() {
        dfd.resolve(hex); 
    });
   
    stage.add(shape);

    return dfd.promise();
}

function getChitCoords(hex) {
    var v = decompress(hex);
    var xy = getPixelCoords(v[0], v[1]);

    var xcoord = xy[0];
    var ycoord = xy[1];

    xcoord += SCALE_HEIGHT / 2 + TEXT_XOFFSET;
    ycoord += SCALE_WIDTH / 2 + TEXT_YOFFSET;

    return [xcoord, ycoord]
}

function dispChit(context, number, hex) {
    var xy = getChitCoords(hex);

    var xcoord = xy[0];
    var ycoord = xy[1];

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


function drawResourceCounters() {

    var brick  = gameboard.cards.brick;
    var lumber = gameboard.cards.lumber;
    var wool   = gameboard.cards.wool;
    var grain  = gameboard.cards.grain;
    var ore    = gameboard.cards.ore;

    var context = stage.getContext();

    context.font = RESOURCE_FONT;
    context.fillStyle = RESOURCE_FONT_COLOR;

    context.clearRect(RESOURCE_XCOORD - 20, RESOURCE_YCOORD - 20, BOARD_SIZE, BOARD_SIZE);

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
