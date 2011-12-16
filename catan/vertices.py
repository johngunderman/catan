"""
We model a 6x6 grid of hexagons.  Obviously some hexagons are not
valid in the context of a catan board, thus some of the vertices on
them are also not valid positions on a catan board.

We consider two vertices on each hexagon, the west vertex, and the
northwest vertex.  Together with the location of a hexagon, the WEST
or NORTHWEST information can model the position of any vertex on the
board.

Each vertex is thus a 3-tuple (x,y,d).  x and y are zero-indexed.  d
is {WEST = 0, NORTHWEST = 1}.
"""

import operator
import hexes

rows = [(0,6), (0,8), (0,10), (1,11), (3,11), (5,11)] #a[x] is the indices of (first good vertex, last good vertex)
indices = [0, 7, 16, 27, 38, 47] #a[y] is the number of vertices that occur before row y
max_value = 54

"""
in_range(p) returns True iff the compressed vertex is in the correct range for vertices
"""
def in_range(p):
    return p >= 0 and p <= max_value


"""
isvalid(v) returns True iff the vertex 3-tuple p is valid in the context of a Catan board
"""
def isvalid((x,y,d)):
    if y<0 or y>5:
        return False

    (low, high) = rows[y]
    pos = 2*x + d
    return pos >= low and pos <= high and (d == 0 or d == 1)

"""
adjacent(p) returns a list of at most three vertices which are
directly adjacent to _vertex_ p.
"""
def adjacent((x,y,d)):
    if d == 0:
        return filter(isvalid,[(x-1, y, 1), (x, y, 1), (x, y+1, 1)])
    if d == 1:
        return filter(isvalid,[(x, y-1, 0), (x, y, 0), (x+1, y, 0)])

"""
adjacent_hexes(p) returns a list of at most three hexes which are
directly adjacent to _vertex_ p
"""
def adjacent_hexes(p):
    (x,y,d) = p
    adjacency = [[(0,0,1), (-1, -1, 1), (-1, 0, 1)], [(0, -1, 0), (-1, -1, 0), (0, 0, 0)]]
    candidates = [map(operator.add, p, o) for o in adjacency[d]]
    return filter(hexes.isvalid, candidates)

"""
Takes a 3-tuple p and represents it as a single integer for easy
storage and transmission
"""
def compress((x,y,d)):
    return indices[y] + 2*x + d - rows[y][0]

"""
The inverse of compress(p)
"""
def decompress(p):
    y = len([i for i in indices if i <= p]) - 1
    p += rows[y][0] - indices[y]
    return (p/2, y, p % 2)

"""
Tests whether decompress(compress(g)) == g.  Should probably be
factored elsewhere
"""
def test_sanity():
    from random import randint
    bad = []
    for i in range(0,1000):
        g = (randint(0,5), randint(0,5), randint(0,1))
        if isvalid(g) and not decompress(compress(g)) == g:
            bad.append(g)
    return len(bad) == 0
