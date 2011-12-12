
IMAGE_SOURCE = 'images/tiles.png';
TILE_HEIGHT = 306;
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


// GLOBALS BELOW, CONSTANTS ABOVE

gameID = -1;
// at some point this needs to be gotten from the server
userID = 1;

// shows where we are in the sequence of actions for this game.
sequenceNum = 0;

// actions to commit at the end of the user's turn
actionsMade = [];
