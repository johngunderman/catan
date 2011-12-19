import json
from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, ForeignKey, Text
from sqlalchemy.orm import relationship

from database import Base, db_session
import vertices as v
import hexes as h

import random

VICTORY_SCORE = 10

class Terrain:
    (FOREST, PASTURE, FIELDS, HILLS, MOUNTAINS, DESERT) = range(1,7)

CardTypes = [
    "Wood", "Sheep", "Wheat", "Brick", "Ore",
    "Knight", "Library", "Palace", "Chapel", "University"
    "Market", "RoadBuilding", "YearOfPlenty"
]

class BuildTypes:
    ROAD        = 1
    TOWN        = 2
    CITY        = 3
    DEVCARD     = 4

class User(Base):
    __tablename__ = "User"
    UserID = Column(Integer, primary_key=True)

    def join_game(self, game):
        player = GamePlayer(self.UserID)
        game.players.append(player)

        game.log(Log.joined(self.UserID))
        return player

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

    def start(self):
        """Test ideas:
        - create_board should be len(19)
        - it should 2-ples
        """
        def create_board():
            chits = (5, 10, 8, 2, 9, 3, 4, 6, 11, 6, 11, 3, 4, 5, 12, 8, 10, 9)
            preboard = zip(h.preboard_hexes, chits)

            types = [Terrain.FOREST]*4 + [Terrain.PASTURE]*4 + [Terrain.FIELDS]*4 + [Terrain.HILLS]*3 + [Terrain.MOUNTAINS]*3
            random.shuffle(types) #Shuffle the hexes

            board = [Hex(vertex, chit, type) for ((vertex, chit), type) in zip(preboard, types)]
            board.append(Hex(Game.ROBBER_START_HEX, 7, Terrain.DESERT)) #the desert tile is fixed

            return board

        self.State = Game.States.SETUP_FORWARD

        self.hexes = create_board()
        self.RobberHex = Game.ROBBER_START_HEX
        self.log(Log.hexes_placed(self.hexes))

        self.CurrentIndex = 0
        self.CurrentPlayerID = self.players[self.CurrentIndex].UserID

    def begin_turn(self):
        rolled = random.randint(1,6) + random.randint(1,6)
        self.log(Log.rolled(self.CurrentPlayerID, rolled))
        if rolled == 7:
            self.log(Log.req_robber(self.CurrentPlayerID))
            self.State = Game.States.MOVE_ROBBER
        else:
            self.log(Log.req_turn(self.CurrentPlayerID))
            def give_cards(rolled):
                #gets hexes that have just yielded stuff
                rolled_hexes = db_session.query(Hex.Vertex, Hex.Type). \
                    filter_by(GameID=self.GameID). \
                    filter(Hex.Chit == rolled). \
                    filter(Hex.Vertex != self.RobberHex). \
                    all()

                """
                Creates a dict of the form:
                (type -> (vertex -> count)
                where:
                    type is the type of hex
                    vertex is a vertex number adjacent to the hex
                    count is the number of times that vertex would
                        receive cards of type *type*

                It may be better to do sort | uniq here
                """
                types = {}
                for (hex, type) in rolled_hexes:
                    if not type in types:
                        types[type] = {}

                    adjacent = map(v.compress, h.adjacent(v.decompress(hex)))
                    for i in adjacent:
                        if not i in types[type]:
                            types[type][i] = 0
                        types[type][i] += 1

                """
                Creates a dict of the form:
                (userid -> (type -> count))
                where:
                    userid is self explanatory
                    type if the type of resource
                        (equivalent to the type of hex)
                    count is the number of cards of that resource type

                """
                users = {}
                for t in types:
                    #get all settlements that are adjacent to hexes
                    #of type *type*
                    settlements = Settlement.query. \
                        filter_by(GameID=self.GameID). \
                        filter(Settlement.Vertex.in_(types[t].keys())). \
                        all()

                    for s in settlements:
                        if not s.UserID in users:
                            users[s.UserID] = {}
                        if not t in users[s.UserID]:
                            users[s.UserID][t] = 0
                        #give double for cities
                        users[s.UserID][t] += \
                            (2 if s.Type == Settlement.CITY else 1) * \
                            types[t][s.Vertex]

                for u in users:
                    allocated = list(map(lambda type: (users[u][type], type), users[u].keys()))

                    GamePlayer.query. \
                        filter_by(GameID=self.GameID). \
                        filter_by(UserID=u).one(). \
                        add_cards(allocated)

            give_cards(rolled)


    def log(self, action):
        l = Log(self.NextSequence, json.dumps(action))
        self.__log.append(l)
        self.NextSequence += 1


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
        self.Knight = 14

        #Victory Point
        self.Library = 1
        self.Palace = 1
        self.Chapel = 1
        self.University = 1
        self.Market = 1

        #Progress Cards
        self.RoadBuilding = 2
        self.YearOfPlenty = 2
        self.Monopoly = 2

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
    Score = Column(SmallInteger, nullable=False, default=0)

    cards = relationship("PlayerCards", uselist=False, backref="player")

    def __init__(self,userid):
        self.cards = PlayerCards()
        self.UserID = userid

    #roads = relationship("Road",primaryjoin="(Road.UserID == GamePlayer.UserID) & (Road.GameID == GamePlayer.GameID)")
    #settlements = relationship("Settlement")

    __reqs = {
        BuildTypes.ROAD : [(1, "Wood"), (1, "Brick")],
        BuildTypes.TOWN: [(1, "Wood"), (1, "Brick"), (1, "Sheep"), (1, "Wheat")],
        BuildTypes.CITY : [(3, "Ore"), (2, "Wheat")],
        BuildTypes.DEVCARD : [(1, "Sheep"), (1, "Ore"), (1, "Wheat")]
    }

    def hasResourcesFor(self, buildType):
        def above(amnt, type):
            x = getattr(self.cards, type)
            return x >= amnt

        return all([above(amnt, type) for (amnt, type) in self.__reqs[buildType]])

    def takeResourcesFor(self, buildType):
        for (amnt, type) in self.__reqs[buildType]:
            x = getattr(self.cards, type)
            setattr(self.cards, type, x - amnt)

    def road_meets_q(self, vertex1, vertex2):
        vertices = (vertex1, vertex2)
        return Road.query. \
            filter_by(GameID=self.GameID). \
            filter_by(UserID=self.UserID). \
            filter(
                Road.Vertex1.in_(vertices) |
                Road.Vertex2.in_(vertices)
            )

    def settlements_q(self):
        return Settlement.query. \
                filter_by(GameID=self.GameID). \
                filter_by(UserID=self.UserID)

    def roads_q(self):
        return Road.query. \
                filter_by(GameID=self.GameID). \
                filter_by(UserID=self.UserID)

    def add_settlement(self, vertex):
        s = Settlement(self.UserID, vertex)
        self.game.settlements.append(s)
        return s
        
    def add_road(self, vertex1, vertex2):
        r = Road(self.UserID, vertex1, vertex2)
        self.game.roads.append(r)
        return r

    def add_cards(self, cards):
        for (amount, type) in cards:
            attr = CardTypes[type - 1] #ugly hack
            x = getattr(self.cards, attr)
            setattr(self.cards, attr, x + amount)
        self.game.log(Log.got_resources(self.UserID, cards))

    def checkVictory(self):
        if(self.Score >= VICTORY_SCORE):
            self.game.log(Log.game_over(self.UserID))

class PlayerCards(Base):
    __tablename__ = "PlayerCards"
    PlayerID = Column(Integer, ForeignKey("GamePlayer.PlayerID"), primary_key=True)
    Brick = Column(SmallInteger, default=0, nullable=False)
    Wood = Column(SmallInteger, default=0, nullable=False)
    Wheat = Column(SmallInteger, default=0, nullable=False)
    Sheep = Column(SmallInteger, default=0, nullable=False)
    Ore = Column(SmallInteger, default=0, nullable=False)
    Monopoly = Column(SmallInteger, default=0, nullable=False)
    Library = Column(SmallInteger, default=0, nullable=False)
    Knight = Column(SmallInteger, default=0, nullable=False)
    Palace = Column(SmallInteger, default=0, nullable=False)
    Chapel = Column(SmallInteger, default=0, nullable=False)
    University = Column(SmallInteger, default=0, nullable=False)
    Market = Column(SmallInteger, default=0, nullable=False)
    RoadBuilding = Column(SmallInteger, default=0, nullable=False)
    YearOfPlenty = Column(SmallInteger, default=0, nullable=False)

    
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

    @staticmethod
    def overlaps_q(player, vertex1, vertex2):
        return Road.query. \
            filter_by(GameID=player.GameID). \
            filter_by(Vertex1=vertex1). \
            filter_by(Vertex2=vertex2)

class Settlement(Base):
    __tablename__ = "Settlement"

    TOWN = 0
    CITY = 1

    GameID = Column(Integer, ForeignKey("Game.GameID"), primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    UserID = Column(Integer, ForeignKey("User.UserID"),nullable=False)
    Type = Column(SmallInteger, default=TOWN, nullable=False)

    def __init__(self, userid, vertex):
        self.UserID = userid
        self.Vertex = vertex

    """
    Returns True iff the a settlement can be placed on the given vertex
    """
    @staticmethod
    def distance_rule(gameid, vertex):
        checkvertices = map(v.compress, [vertex] + v.adjacent(vertex))
        return Settlement.query. \
            filter_by(GameID=gameid). \
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
    def setup(player, settlement, roadto):
        return { "action" : "setup", "user" : player.UserID, "settlement": settlement, "vertex2": roadto }

    @staticmethod
    def road_built(player, road):
        return { "action" : "road_built", "user" : player.UserID, "vertex1": road.Vertex1, "vertex2": road.Vertex2 }

    @staticmethod
    def settlement_built(player, settlement):
        return { "action" : "settlement_built", "user" : player.UserID, "vertex": settlement.Vertex, "score": player.Score }

    @staticmethod
    def settlement_upgraded(player, vertex):
        return { "action" : "settlement_upgraded", "user" : player.UserID, "vertex": vertex, "score": player.Score }

    @staticmethod
    def req_turn(userid):
        return { "action": "req_turn", "user": userid}

    @staticmethod
    def joined(userid):
        return { "action": "joined", "user": userid }

    @staticmethod
    def game_over(userid):
        return { "action": "game_over", "winner": userid }

    @staticmethod
    def req_robber(userid):
        return { "action": "req_robber", "user": userid }

    @staticmethod
    def robber_moved(userid, to):
        return { "action": "robber_moved", "user": userid, "to": to }

    @staticmethod
    def rolled(userid, rolled):
        return { "action": "rolled", "user": userid, "rolled": rolled }

    @staticmethod
    def setup(player, settlement_vertex, road_to):
        return { "action": "setup", "user": player.UserID, "settlement": settlement_vertex, "road_to": road_to }
