import operator
import vertices as v

valid_hexes = [1,3,5,8,10,12,14,17,21,23,25,29,31,33,35,40,42,44]
__adjacency = [(0, 0, -1), (0, 0, 0), (0, 1, 0), (1, 1, -1), (1, 1, 0), (1, 0, -1)]

"""
Takes a 3-tuple p and returns 3-tuples for all adjacent hexes
"""
def adjacent(p):
    return [tuple(map(operator.add, p, o)) for o in __adjacency]

def isvalid(p):
    (x,y,d) = p
    #this seems inelegant.  Using compressed values to check validity?
    return v.compress(p) in valid_hexes
