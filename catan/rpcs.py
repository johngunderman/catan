import random

DESERT_CHIT = 7
DESERT_POSITION = 8
CHITS = [5, 10, 8, 2, 9, 3, 4, 6, 11, 6, 11, 3, 4, 5, 12, 8, 10, 9]

class Terrain:
    FOREST = 1
    PASTURE = 2
    GRAIN = 3
    BRICK = 4
    ORE = 5
    DESERT = 6

"""Test ideas:
create_board should be len(19)
it should 2-ples

"""
def start_game():
    Game
    def create_board():
       hexes = [Terrain.FOREST]*4 + [Terrain.PASTURE]*4 + [Terrain.GRAIN]*4 + [Terrain.BRICK]*3 + [Terrain.ORE]*3
       random.shuffle(hexes) #Shuffle the hexes
       hexes = zip(hexes, CHITS) #Give them chits
       hexes = hexes[:DESERT_POSITION] + [(Terrain.DESERT, DESERT_CHIT)] + hexes[DESERT_POSITION:] #Place the desert in a fixed place
       return hexes

    return create_board()

def fake_create_game()
    for u in User.query.limit(4):
        

def create_game():
    g = Game()
    

def join_game():
    

