import json #TODO: Does this follow convention?
from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base
import vertices as v
import hexes as h

import random

log_waiters = set()

class Terrain:
    (FOREST, PASTURE, FIELDS, HILLS, MOUNTAINS, DESERT) = range(1,7)

CardTypes = {
    "Wood", "Sheep", "Wheat", "Brick", "Ore",
    "Knight", "Library", "Palace", "Chapel", "University"
    "Market", "RoadBuilding", "YearOfPlenty"
}
 
class BuildTypes:
    ROAD        = 1
    TOWN        = 2
    CITY        = 3
    DEVCARD     = 4


class User(Base):
    __tablename__ = "User"
    UserID = Column(Integer, primary_key=True)

class Game(Base):
    class States:
        (
            NOTSTARTED,
            SETUP_FORWARD,
            SETUP_BACKWARD,
            NORMAL_PLAY,
            DISCARD_CARDS,
            MOVE_ROBBER,
            STEAL_CARDS,
            VICTORY
        ) = range(1,9)
        
    ROBBER_START_HEX = 19

    __tablename__ = "Game"

    GameID = Column(Integer, primary_key=True)
    GameName = Column(String)
    State = Column(SmallInteger, nullable=False)
    RobberHex = Column(SmallInteger)
    CurrentIndex = Column(SmallInteger)
    CurrentPlayerID = Column(Integer, ForeignKey("User.UserID"))
    NextSequence = Column(Integer, nullable=False)

    players = relationship("GamePlayer", backref="game")
    cards = relationship("GameCards", uselist=False)
    hexes = relationship("Hex")
    settlements = relationship("Settlement")
    roads = relationship("Road")
    __log = relationship("Log")

    def __init__(self):
        self.State = Game.States.NOTSTARTED
        self.cards = GameCards()
        self.NextSequence = 0;

    """Test ideas:
    - create_board should be len(19)
    - it should 2-ples
    """
    @staticmethod
    def create_hexes():
        chits = (5, 10, 8, 2, 9, 3, 4, 6, 11, 6, 11, 3, 4, 5, 12, 8, 10, 9)
        preboard = zip(h.valid_hexes, chits)
        
        types = [Terrain.FOREST]*4 + [Terrain.PASTURE]*4 + [Terrain.FIELDS]*4 + [Terrain.HILLS]*3 + [Terrain.MOUNTAINS]*3
        random.shuffle(types) #Shuffle the hexes

        hexes = [Hex(vertex, chit, type) for ((vertex, chit), type) in zip(preboard, types)]
        hexes.append(Hex(Game.ROBBER_START_HEX, 7, Terrain.DESERT)) #the desert tile is fixed

        return hexes

    def log(self, action):
        l = Log(self.NextSequence, json.dumps(action))
        self.__log.append(l)
        self.NextSequence += 1

        for i in list(log_waiters):
            i()


class GameCards(Base):
    __tablename__ = "GameCards"

    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Knight = Column(SmallInteger)
    Library = Column(SmallInteger)
    Palace = Column(SmallInteger)
    Chapel = Column(SmallInteger)
    University = Column(SmallInteger)
    Market = Column(SmallInteger)
    RoadBuilding = Column(SmallInteger)
    YearOfPlenty = Column(SmallInteger)
    Monopoly = Column(SmallInteger)

    def __init__(self):
        #TODO: Check these numbers
        self.Knight = 14

        #Victory Point
        self.Library = 1
        self.Palace = 1
        self.Chapel = 1
        self.University = 1
        self.Market = 1

        #Progress Cards
        self.RoadBuilding = 3 #TODO: Check this
        self.YearOfPlenty = 3 #TODO: Check this
    
    def drawDevCard(self):
        deck = sum([[type] * getattr(self, type) for type in CardTypes])
        card = random.choice(deck)
        setattr(self, card, getattr(self, card) - 1)
        return card

class GamePlayer(Base):
    __tablename__ = "GamePlayer"
    PlayerID = Column(Integer, primary_key=True)
    GameID = Column(Integer, ForeignKey("Game.GameID"))
    UserID = Column(Integer, ForeignKey("User.UserID"))

    def __init__(self,userid):
        self.UserID = userid
    
    #cards = relationship("PlayerCards", uselist=False)
    #roads = relationship("Road",primaryjoin="(Road.UserID == GamePlayer.UserID) & (Road.GameID == GamePlayer.GameID)")
    #settlements = relationship("Settlement")
 
    __reqs = {
        BuildTypes.ROAD : [(1, "Wood"), (1, "Brick")],
        BuildTypes.TOWN: [(1, "Wood"), (1, "Brick"), (1, "Sheep"), (1, "Wheat")],
        BuildTypes.CITY : [(3, "Ore"), (2, "Wheat")],
        BuildTypes.DEVCARD : [(1, "Sheep"), (1, "Ore"), (1, "Wheat")]
    }

        
    def hasCardsFor(self, buildType):
        return all(lambda (amnt, type) : self.cards[type] >= amnt, __reqs[buildType])

    #an eventual unification of "resources" and "cards" would be nice
    def takeCardsFor(self, buildType):
        for (amnt, type) in __reqs[buildType]:
            self.cards[__cardTypes[type]] -= amnt

    def roads_q(self):
        return Road.query. \
            filter_by(GameID=player.GameID). \
            filter_by(UserID=player.UserID)

    def settlements_q(self):
        return Settlement.query. \
                filter_by(GameID=self.GameID). \
                filter_by(UserID=self.UserID)

class PlayerCards(Base):
    __tablename__ = "PlayerCards"
    PlayerID = Column(Integer, ForeignKey("GamePlayer.PlayerID"), primary_key=True)
    Brick = Column(SmallInteger)
    Wood = Column(SmallInteger)
    Wheat = Column(SmallInteger)
    Sheep = Column(SmallInteger)
    Ore = Column(SmallInteger)
    Monopoly = Column(SmallInteger)
    Library = Column(SmallInteger)
    Knight = Column(SmallInteger)
    Palace = Column(SmallInteger)
    Chapel = Column(SmallInteger)
    University = Column(SmallInteger)
    Market = Column(SmallInteger)
    RoadBuilding = Column(SmallInteger)
    YearOfPlenty = Column(SmallInteger)

class Hex(Base):
    __tablename__ = "Hex"

    def __init__(self, vertex, chit, type):
        self.Vertex = vertex;
        self.Chit = chit
        self.Type = type


    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    Type = Column(SmallInteger)
    Chit = Column(SmallInteger)

class Road(Base):
    __tablename__ = "Road"
    GameID = Column(Integer, ForeignKey("Game.GameID"),primary_key=True)
    UserID = Column(Integer, ForeignKey("User.UserID"))
    Vertex1 = Column(SmallInteger,primary_key=True)
    Vertex2 = Column(SmallInteger,primary_key=True)

    def __init__(self, userid, vertex1, vertex2):
        if(vertex2 < vertex1):
            (vertex1, vertex2) = (vertex2, vertex1)
        self.UserID = userid
        self.Vertex1 = vertex1
        self.Vertex2 = vertex2

    """
    Returns a query for the roads that are at a given (compressed) vertex
    """
    def at_q(player, p):
        return \
            Road.query. \
            filter_by(GameID=player.GameID). \
            filter_by(UserID=player.UserID). \
            filter(or_(p == Road.Vertex1, p == Road.Vertex2))


class Settlement(Base):
    __tablename__ = "Settlement"

    TOWN = 0
    CITY = 1

    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    UserID = Column(Integer, ForeignKey("User.UserID"),nullable=False)
    Type = Column(SmallInteger,nullable=False)

    def __init__(self, userid, vertex):
        self.UserID = userid
        self.Vertex = vertex
        self.Type = Settlement.TOWN

    """
    Returns True iff the a settlement can be placed on the given vertex
    """
    @staticmethod
    def distance_rule(player, vertex):
        checkvertices = map(v.compress, [vertex] + v.adjacent(vertex))
        return Settlement.query. \
            filter_by(GameID=player.GameID). \
            filter(Settlement.Vertex.in_(checkvertices)). \
            count() == 0

class Port(Base):
    __tablename__ = "Port"
    GameID = Column(Integer, primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    Type = Column(SmallInteger)

class Log(Base):
    __tablename__ = "Log"

    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Sequence = Column(Integer, primary_key=True)
#Perhaps add a UserSequence field, specific to the user who sent in the item?
    Action = Column(Text)

    def __init__(self, sequence, action):
        self.Sequence = sequence
        self.Action = action

    @staticmethod
    def got_resources(userid, cards):
        return { "action": "resources_gained", "user" : userid, "cards": cards }

    @staticmethod
    def req_setup(userid):
        return { "action": "req_setup", "user": userid }

    @staticmethod
    def hexes_placed(hexes):
        #change args to something more meaningful?
        return { "action": "hexes_placed", "args": 
            [[i.Vertex, i.Chit, i.Type] for i in hexes ]}

    @staticmethod
    def settlement_built(userid, vertex):
        return { "action" : "settlement_built", "user" : userid, "vertex": vertex}

    @staticmethod
    def settlement_upgraded(userid, vertex):
        return { "action" : "settlement_upgraded", "user" : userid, "vertex": vertex}

    @staticmethod
    def req_turn(userid):
        return { "action": "req_turn", "user": userid }
