from database import Base
from sqlalchemy import Column, DateTime, Integer, SmallInteger, String, ForeignKey, Text
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "User"
    UserID = Column(Integer, primary_key=True)

class Game(Base):
    __tablename__ = "Game"

    GameID = Column(Integer, primary_key=True)
    DateStarted = Column(DateTime) #or timestamp, maybe?
    GameName = Column(String)
    CurrentPlayerID = Column(Integer, ForeignKey("User.UserID"))

    players = relationship("GamePlayer")
    cards = relationship("GameCards", uselist=False)

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
    GameID = Column(Integer, primary_key=True)
    Vertex = Column(SmallInteger, primary_key=True)
    Type = Column(SmallInteger, primary_key=True)
    Chit = Column(SmallInteger, primary_key=True)

class Road(Base):
    __tablename__ = "Road"
    GameID = Column(Integer, ForeignKey("Game.GameID"),primary_key=True)
    UserID = Column(Integer, ForeignKey("User.UserID"))
    Vertex1 = Column(SmallInteger,primary_key=True)
    Vertex2 = Column(SmallInteger,primary_key=True)

class Settlement(Base):
    __tablename__ = "Settlement"
    GameID = Column(Integer, primary_key=True)
    UserID = Column(Integer)
    Type = Column(SmallInteger)
    Vertex = Column(SmallInteger, primary_key=True)

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

