IMAGE_SOURCE = 'images/tiles.png';
TILE_HEIGHT = 306;
TILE_WIDTH  = 354;
TILE_OFFSET = 86;                  // the horizontal offset of the hexagon

SCALE_HEIGHT = 85;
SCALE_WIDTH  = 98;
SCALE_OFFSET = 24;

TEXT_XOFFSET =  5;
TEXT_YOFFSET = -5;
// if we have multiple digits we have to shift over to make our text center
TEXT_DD_OFFSET = -1;

// Chit constants
CHIT_RADIUS             = 15;
CHIT_FONT               = "12pt sans-serif";
CHIT_FONT_COLOR         = "white";
CHIT_ROBBER_COLOR       = "black";
CHIT_DEFAULT_COLOR      = "brown";
CHIT_DEFAULT_RIM_COLOR  = "black";
// inner ring color for high probability chits (8 and 6)
CHIT_HIGH_PROB_COLOR    = "red";
// inner ring color for low probability chits (2 and 12)
CHIT_LOW_PROB_COLOR     = "grey";
CHIT_DEFAULT_PROB_COLOR = "brown";

BOARD_SIZE = 600;

OCEAN     = 0;
FOREST    = 1;
PASTURE   = 2;
FIELDS    = 3;
HILLS     = 4;
MOUNTAINS = 5;
DESERT    = 6;

DETECTOR_COLOR = "red";

var cardNames = {}
cardNames[FOREST] = "wood";
cardNames[PASTURE] = "sheep";
cardNames[FIELDS] = "wheat";
cardNames[HILLS] = "brick";
cardNames[MOUNTAINS] = "ore";

WEST      = 0;
NORTHWEST = 1;


MAX_VERTEX = 53;
VERTICES = []

for(var x = 0;x <= MAX_VERTEX; x++) {
    VERTICES.push(x);
}

// resource counter constants
RESOURCE_FONT = "12pt sans-serif";
RESOURCE_FONT_COLOR = "black";

RESOURCE_TEXT_OFFSET = 10;
RESOURCE_VERTICAL_SPACING = 20;

RESOURCE_XCOORD = 500;
RESOURCE_YCOORD = 500;

SETTLEMENT = 1;
CITY = 2;

TICKER_XOFFSET = 10;
TICKER_BASE = 20;
TICKER_INC = 25;
TICKER_LENGTH = 15;


PLAYER_DISPLAY_OFFSET = 35;
PLAYER_DISPLAY_SCORE_OFFSET = 130;
PLAYER_DISPLAY_CIRCLE_OFFSET = 15;

HOSTNAME = "";

// a[x] is the indices of (first good vertex, last good vertex)
rows = [[0,6], [0,8], [0,10], [1,11], [3,11], [5,11]];
//a[y] is the number of vertices that occur before row y
indices = [0, 7, 16, 27, 38, 47];

tickerLog = [];

// GLOBALS BELOW, CONSTANTS ABOVE
// we shall code in the shade
// 'til we run out of rum.

usercolors = ["#F90", "#F00", "#000", "#008" ];

// shows where we are in the sequence of actions for this game.
sequenceNum = 0;

// actions to commit at the end of the user's turn
// {action : foo, vertex : bar}
actionsMade = [];


// see gamelogic.js for a complete description of how data is
// stored in our game board representation
gameboard = {
    "users": {},
    // form of {settlement = SETTLEMENT | CITY, user : user}
    "settlements" : {},
    // roads are owned by a user
    "roads" : {},
    "cards" : {
        "brick"  : 0,
        "lumber" : 0,
        "wool"   : 0,
        "grain"  : 0,
        "ore"    : 0
    },
    "scores" : {}
};
