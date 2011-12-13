
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
        if(indices[y] > p) {
            break;
        }
    }

    y--; //We actually scan past the one we want, go back one
    p += rows[y][0] - indices[y];
    return [Math.floor(p / 2), y, p % 2]
}


// Takes a 3-tuple loc and represents it as a single integer for easy
// storage and transmission
function compress(loc) {
    var x = loc[0];
    var y = loc[1];
    var d = loc[2];
    return indices[y] + 2*x + d - rows[y][0];
}
