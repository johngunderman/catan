
IMAGE_SOURCE = 'images/tiles.png';
TILE_HEIGHT = 304;
TILE_WIDTH  = 354;
TILE_OFFSET = 86;                  // the horizontal offset of the hexagon

SCALE_HEIGHT = 85;
SCALE_WIDTH  = 98;
SCALE_OFFSET = 24;

BOARD_SIZE = 600;

OCEAN     = 0;
FOREST    = 1;
PASTURE   = 2;
FIELDS    = 3;
HILLS     = 4;
MOUNTAINS = 5;
DESERT    = 6;

WEST      = 0;
NORTHWEST = 1;

HOSTNAME = 'http://localhost:5000';

// a[x] is the indices of (first good vertex, last good vertex)
rows = [[0,6], [0,8], [0,10], [1,11], [3,11], [5,11]];
//a[y] is the number of vertices that occur before row y
indices = [0, 7, 16, 27, 38, 47];

gameID = -1;


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

// hexes are encoded as [vertex, chit, type]
function dispBoard(img, context, hexes) {
    console.log("about to display board");
    console.log(hexes);

    for (var x = 0; x < hexes.length; x++) {
        var xyd = decompress(hexes[x][0]);
        console.log("drawing hex at " + hexes[x][0]);
        console.log("drawing hex at " + xyd);

        drawHexAt(img, context, hexes[x][2], xyd[0], xyd[1]);
    }
}


function drawCoords(context) {
    // draw us some coordinates:
    for (var x = -1; x < 7; x++) {
        for (var y = -1; y < 7; y++) {
            //dispAtVertex(x + "," + y + ",0", context, x, y, 0);
            dispAtVertex(x + "," + y + ",1", context, x, y, 1);
        }
    }
}


function dispDemoBoard(img, context) {
    drawHexAt(img, context, FOREST, 0,0);
    drawHexAt(img, context, DESERT, 0,1);
    drawHexAt(img, context, PASTURE, 0,2);
    drawHexAt(img, context, ORE, 1,0);
    drawHexAt(img, context, BRICK, 1,1);
    drawHexAt(img, context, FOREST, 1,2);
    drawHexAt(img, context, ORE, 1,3);
    drawHexAt(img, context, PASTURE, 2,0);
    drawHexAt(img, context, FOREST, 2,1);
    drawHexAt(img, context, PASTURE, 2,2);
    drawHexAt(img, context, BRICK, 2,3);
    drawHexAt(img, context, DESERT, 2,4);
    drawHexAt(img, context, BRICK, 3,1);
    drawHexAt(img, context, ORE, 3,2);
    drawHexAt(img, context, DESERT, 3,3);
    drawHexAt(img, context, FOREST, 3,4);
    drawHexAt(img, context, DESERT, 4,2);
    drawHexAt(img, context, BRICK, 4,3);
    drawHexAt(img, context, PASTURE, 4,4);
}


// called when initializing the board
// here we draw all the valid road detectors
// see drawRoadDetector() for more info
function drawAllRoadDetectors(stage) {
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 6; y++) {
	    var v1 = [x,y,WEST];
            if(isvalid(v1)) {
                var adj = adjacent(v1);
                for (var z = 0; z < adj.length; z++) {
                    var v2 = adj[z];
                    drawRoadDetector(stage, v1, v2);
                }
            }
        }
    }
}

// On the given stage, draw a road detector from the vertice
// described with (x1,y1,d1) to the vertice (x2,y2,d2).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a road at the given line when clicked.
function drawRoadDetector(stage, v1, v2) {

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

        context.moveTo(coords1[0] - width, coords1[1] - width);
        context.lineTo(coords1[0] + width, coords1[1] + width);
        context.lineTo(coords2[0] + width, coords2[1] + width);
        context.lineTo(coords2[0] - width, coords2[1] - width);
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
        document.body.style.cursor = "default";
        context.beginPath();
        context.lineWidth = 6;
        context.strokeStyle = "red";
        context.fillStyle = "rgba(0,0,0,0)";
        context.moveTo(coords1[0], coords1[1]);
        context.lineTo(coords2[0], coords2[1]);
        context.closePath();
        context.fill();
        context.stroke();

        stage.removeAll();
    });

    stage.add(line);
}


// called when initializing the board
// here we draw all the valid city detectors
// see drawCityDetector() for more info
function drawAllCityDetectors(stage) {
    for (var x = 0; x < 6; x++) {
        for (var y = 0; y < 6; y++) {
            var v1 = [x,y,WEST];
            var v2 = [x,y,NORTHWEST];
            if(isvalid(v1)) {
                drawCityDetector(stage,v1);
            }
            if(isvalid(v2)) {
                drawCityDetector(stage,v2);
            }
        }
    }
}

// On the given stage, draw a city detector on the vertice
// described with (x1,y1,d1).
// Note that these are game piece vertices, not pixel locations.
// the detector will draw a city at the given vertex when clicked.
function drawCityDetector(stage, vertex) {

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
        var width = 6;
        document.body.style.cursor = "default";
        context.beginPath();
        context.lineWidth = 6;
        context.strokeStyle = "red";
        context.fillStyle = "red";
        context.moveTo(coords[0] - width, coords[1] - width);
        context.lineTo(coords[0] - width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] + width);
        context.lineTo(coords[0] + width, coords[1] - width);

        context.closePath();
        context.fill();
        context.stroke();

        stage.removeAll();
    });

    stage.add(city);
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

    context.drawImage(img, TILE_WIDTH * hexNum, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      xcoord, ycoord,
                      SCALE_WIDTH, SCALE_HEIGHT);
}

function initTicker() {
    // Init ticker
    var example = document.getElementById('ticker');
    var context = example.getContext('2d');
    context.fillStyle = "rgb(49,79,79)";
    context.font    = 'bold 12px sans-serif';
    var i = 1;
    context.fillText  ("Player 1 got 2 wheats and 1 ore", 28, 20*i);i=i+1;
    context.fillText  ("Player 4 got 1 wheat", 28, 20*i);i=i+1;
    context.fillText  ("Player 4 put built a settlement", 28, 20*i);i=i+1;
    context.fillText  ("Player 4 built two roads", 28, 20*i);i=i+1;
    context.fillText  ("Player 3 rolled a 5", 28, 20*i);i=i+1;
    context.fillText  ("Player 2 got 1 brick", 28, 20*i);i=i+1;
    context.fillText  ("Player 3 wants 2 sheep", 28, 20*i);i=i+1;
    context.fillText  ("Trade finalized:", 28, 20*i);i=i+1;
    context.fillText  ("Player 3 got 2 sheep", 28, 20*i);i=i+1;
    context.fillText  ("Player 2 got 1 ore", 28, 20*i);i=i+1;
    context.fillText  ("Player 3 built a city", 28, 20*i);i=i+1;
    context.fillText  ("Player 4 rolled a 7", 28, 20*i);i=i+1;
    context.fillText  ("Player 3 discards 2 wheat, 2 ore", 28, 20*i);i=i+1;
    context.fillText  ("Player 2 takes wheat from Player 2", 28, 20*i);i=i+1;
    context.fillText  ("blablabla", 28, 20*i);i=i+1;
    context.fillText  ("blablabla", 28, 20*i);i=i+1;
    context.fillText  ("blablabla", 28, 20*i);i=i+1;
    context.fillText  ("blablabla", 28, 20*i);i=i+1;
}

function initWhitespace() {
    // init whitespace
    var example = document.getElementById('whitespace');
    var context = example.getContext('2d');
    context.fillStyle = "rgb(34,139,34)";
    context.beginPath();
    context.arc(40, 43, 10, 0, Math.PI*2, true);
    context.closePath();
    context.fill();
    context.font    = 'bold 20px sans-serif';
    context.fillText  ("It's your turn!", 70, 50);
    context.fillText  ("1:37", 180, 105);
}

function initPlayerDisplay() {
    // init playersDisplay
    var example = document.getElementById('players');
    var context = example.getContext('2d');
    context.fillStyle = "rgb(0,0,128)";
    context.font    = 'bold 15px sans-serif';
    context.textBaseline    = 'bottom';
    //context.fillText  ("Player 0", 0, 30)
    for(var i=1;i<5;i=i+1) {
        if(i==1) {
            context.fillStyle = "rgb(0,0,128)";
        }
        if (i==2) {
            context.fillStyle = "rgb(131,139,131)";
        }
        if (i==3) {
            context.fillStyle = "rgb(255,0,0)";
        }
        if (i==4) {
            context.fillStyle = "rgb(255,140,0)";
        }
        context.fillText  ("Player "+ i, 28, 30*i);
        context.fillStyle = "rgb(0,0,0)";
        context.fillText  ("(score)", 130, 30*i);
    }
    context.fillStyle = "rgb(34,139,34)";
    context.beginPath();
    context.arc(15, 50, 5, 0, Math.PI*2, true);
    context.closePath();
    context.fill();
}



// isvalid(p) returns True iff the vertex 3-tuple p is valid in the
// context of a Catan board.  vertex is an array of three elements:
// [x,y,d], where [x,y,d] are coordinates for a vertex on the hex
// board.
function isvalid(vertex) {
    var x = vertex[0];
    var y = vertex[1];
    var d = vertex[2];

    if(y<0 || y>5) return false;

    var lowhigh = rows[y];

    var low = lowhigh[0];
    var high = lowhigh[1];
    var pos = 2*x + d;
    return pos >= low && pos <= high && (d == 0 || d == 1);
}

// adjacent(p) returns a list of at most three vertices which are
// directly adjacent to p.
function adjacent(v) {
    var x = v[0];
    var y = v[1];
    var d = v[2];

    if (d == 0) {
        return [[x-1, y, 1], [x, y, 1], [x, y+1, 1]].filter(isvalid);
    }
    if (d == 1) {
        return [[x, y-1, 0],[x, y, 0], [x+1, y, 0]].filter(isvalid);
    }
}

function decompress(p) {
    var y = 0;

    for(; y < indices.length; y++) {
        console.log(p);
        console.log(indices[y] > p);
        if(indices[y] > p) {
            break;
        }
    }

    y--; //We actually scan past the one we want, go back one
    p += rows[y][0] - indices[y];
    return [Math.floor(p / 2), y, p % 2]
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

    var callback = function(json) {
        console.log(json);
        var myJson = JSON.parse(json);
        console.log(myJson);

        if (myJson.log[0].action != "hexes_placed") {
            // TODO throw some crazy error
        }

        var hexes = myJson.log[0].args;

        initBoard(hexes);

    }

    makeAjaxRequest(HOSTNAME + "/start_game", "?user=5&game=1&sequence=0", callback);
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
