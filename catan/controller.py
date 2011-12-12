from database import db_session
from models import *
from string import replace

import vertices
import json

def get_game(gameid):
    return Game.query.get(gameid)

def get_log(game, sequence):
    log = [i.Action for i in Log.query.filter(Log.GameID == game.GameID).filter(Log.Sequence >= sequence).all()]
    return (game.NextSequence, "[" + ",".join(log) + "]")

def create_game(userid):
    game = Game()

    db_session.add(game);
    db_session.commit()
    return game

def start_game(userid, game):
    if not game.start():
        return "failure"

    game.log({ "action" : "hexes_placed", "args": [i.json() for i in game.hexes]})

    db_session.commit()

    return "success"

def build_settlement(userid, game, vertex):
    p = decompress(vertex)
    if isvalid(p): #TODO: we also need to figure out whether the game logic allows it
        s = Settlement(vertex, userid, Settlement.TOWN)
        game.settlements.append(s)
        game.log({ "action" : "settlement_built", "args" : [userid, vertex]})

        db_session.commit()

        return "success"
    else:
        return "failure"

"""
def upgrade_settlement():
def development_card():
def build_road():
def move_robber():
def discard_cards():
"""
