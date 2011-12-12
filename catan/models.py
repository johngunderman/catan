from database import Base
from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, ForeignKey, Text
from sqlalchemy.orm import relationship

import random

class Terrain:
    FOREST = 1
    PASTURE = 2
    GRAIN = 3
    BRICK = 4
    ORE = 5
    DESERT = 6


class User(Base):
    __tablename__ = "User"
    UserID = Column(Integer, primary_key=True)

class Game(Base):
    class States:
        NOTSTARTED = 0
        STARTED = 1

    __tablename__ = "Game"

    GameID = Column(Integer, primary_key=True)
    DateStarted = Column(DateTime)
    State = Column(Integer, nullable=False)
    GameName = Column(String)
    CurrentPlayerID = Column(Integer, ForeignKey("User.UserID"))
    NextSequence = Column(Integer, nullable=False)

    players = relationship("GamePlayer")
    cards = relationship("GameCards", uselist=False)
    hexes = relationship("Hex")
    settlements = relationship("Settlement")
    __log = relationship("Log")

    def __init__(self):
        self.State = Game.States.NOTSTARTED
        self.NextSequence = 0;
        return

    def start(self):
        if(self.State != Game.States.NOTSTARTED):
            return False

        self.State = Game.States.STARTED
        self.cards = GameCards()

        """Test ideas:
        - create_board should be len(19)
        - it should 2-ples
        """
        def create_hexes():
            #(position, chit)
            preboard = [
                (1, 5),
                (3, 10),
                (5, 8),
                (8, 2),
                (10, 9),
                (12, 3),
                (14, 4),
                (17, 6),
                (21, 11),
                (23, 6),
                (25, 11),
                (29, 3),
                (31, 4),
                (33, 5),
                (35, 12),
                (40, 8),
                (42, 10),
                (44, 9)
            ]
            types = [Terrain.FOREST]*4 + [Terrain.PASTURE]*4 + [Terrain.GRAIN]*4 + [Terrain.BRICK]*3 + [Terrain.ORE]*3
            random.shuffle(types) #Shuffle the hexes

            hexes = [Hex(vertex, chit, type) for ((vertex, chit), type) in zip(preboard, types)]
            hexes.append(Hex(19, 7, Terrain.DESERT)) #the desert tile is fixed

            return hexes

        self.hexes = create_hexes();
        return True

    def log(self, action):
        import json #Does this follow convention?
        l = Log(self.NextSequence, json.dumps(action))
        self.__log.append(l)
        self.NextSequence += 1

class GameCards(Base):
    __tablename__ = "GameCards"

    def __init__(self):
        #Check these numbers
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

class GamePlayer(Base):
    __tablename__ = "GamePlayer"
    PlayerID = Column(Integer, primary_key=True)
    GameID = Column(Integer, ForeignKey("Game.GameID"))
    UserID = Column(Integer, ForeignKey("User.UserID"))
    cards = relationship("PlayerCards", uselist=False)

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

    def json(self): #TODO: come up better name?
        return [self.Vertex, self.Chit, self.Type]

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

class Settlement(Base):
    __tablename__ = "Settlement"

    TOWN = 0
    CITY = 1

    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    UserID = Column(Integer, ForeignKey("User.UserID"))
    Type = Column(SmallInteger)

    def __init__(self, vertex, userid, type):
        self.Vertex = vertex
        self.UserID = userid
        self.Type = type

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

