
IMAGE_SOURCE = 'images/tiles.png';
TILE_HEIGHT = 304;
TILE_WIDTH  = 354;
TILE_OFFSET = 86;                  // the horizontal offset of the hexagon

SCALE_HEIGHT = 85;
SCALE_WIDTH  = 98;
SCALE_OFFSET = 24;

WOOD      = 0;
SHEEP     = 1;
MOUNTAIN  = 2;
DESERT    = 3;
OCEAN     = 4;
WASTELAND = 5;


window.onload = function() {
    initTitle();
    initBoard();
    initTicker();
    initWhitespace();
    initPlayerDisplay();
}


function initTitle() {
    var example = document.getElementById('title');
    var context = example.getContext('2d');
    context.fillStyle    = 'rgb(0,0,0)';
    context.font         = 'bold 40px sans-serif';
    context.fillText  ('SETTLERS OF CATAN (TITLE)', 12, 65);
}

function initBoard() {
    // Init the drawing board
    var example = document.getElementById('board');
    var context = example.getContext('2d');
    context.fillStyle = "rgb(255,255,255)";
    context.fillRect(0, 0, 600, 600);

    var img = new Image();
    img.src = IMAGE_SOURCE;

    dispWaterFrame(img, context);

}

function dispWaterFrame(img, context) {
    // first vertical column
    for (x = 1; x < 5; x++) {
        context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                          TILE_WIDTH, TILE_HEIGHT,
                          0, SCALE_HEIGHT * (x + .5),
                          SCALE_WIDTH, SCALE_HEIGHT);
    }

    // second vertical column (only 2)
    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      SCALE_WIDTH - SCALE_OFFSET, SCALE_HEIGHT,
                      SCALE_WIDTH, SCALE_HEIGHT);

    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      SCALE_WIDTH - SCALE_OFFSET, SCALE_HEIGHT * 5,
                      SCALE_WIDTH, SCALE_HEIGHT);

    // third vertical column
    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      2 * (SCALE_WIDTH - SCALE_OFFSET), SCALE_HEIGHT / 2,
                      SCALE_WIDTH, SCALE_HEIGHT);

    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      2 * (SCALE_WIDTH - SCALE_OFFSET), SCALE_HEIGHT / 2 + SCALE_HEIGHT * 5,
                      SCALE_WIDTH, SCALE_HEIGHT);

    // Center column
    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      3 * (SCALE_WIDTH - SCALE_OFFSET), 0,
                      SCALE_WIDTH, SCALE_HEIGHT);

    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      3 * (SCALE_WIDTH - SCALE_OFFSET), SCALE_HEIGHT * 6,
                      SCALE_WIDTH, SCALE_HEIGHT);

    // fourth vertical column
    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      2 * (SCALE_WIDTH - SCALE_OFFSET), SCALE_HEIGHT / 2,
                      SCALE_WIDTH, SCALE_HEIGHT);

    context.drawImage(img, TILE_WIDTH * OCEAN, 0,
                      TILE_WIDTH, TILE_HEIGHT,
                      2 * (SCALE_WIDTH - SCALE_OFFSET), SCALE_HEIGHT / 2 + SCALE_HEIGHT * 5,
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

