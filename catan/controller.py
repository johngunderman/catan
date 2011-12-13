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

    game.log({ "action" : "hexes_placed", "args": [i.log_format() for i in game.hexes]})

    db_session.commit()

    return "success"

def build_settlement(userid, game, vertex):
    p = vertices.decompress(vertex)
    if vertices.isvalid(p): #TODO: we also need to figure out whether the game logic allows it
        player = GamePlayer.query.filter(GamePlayer.GameID == game.GameID).filter(GamePlayer.UserID == userid).first()
        if (player.hasResources(models.BuildTypes.SETTLEMENT)):
            s = Settlement(vertex, userid, Settlement.TOWN)
            game.settlements.append(s)
            game.log({ "action" : "settlement_built", "args" : [userid, vertex]})

            db_session.commit()

            add_log("success", id, sequence)
        else:
            return add_log("failure", id, sequence)
    else:
        return add_log("failure", id, sequence)

def upgrade_settlement(gameid, userid, vertex, sequence):
    p = vertices.decompress(vertex)
    if vertices.isvalid(p): # game logic for allowing an upgrade is different from initially placing a settlement though
        player = GamePlayer.query.filter(GamePlayer.GameID == game.GameID).filter(GamePlayer.UserID == userid).first()
        if(player.hasResources(models.BuildTypes.CITY)):
            g = Game.query.get(id)

            s = Settlement(vertex, userid, Settlement.CITY)
            g.settlements.append(s)
            g.log({ "action" : "settlement_upgraded", "args" : [userid, vertex]})

            db_session.commit()

            return add_log("success", id, sequence)
        else:
            return add_log("failure", id, sequence)
    else:
        return add_log("failure", id, sequence)

def build_road(game, userid, vertex1, vertex2, sequence):
    p1 = vertices.decompress(vertex1)
    p2 = vertices.decompress(vertex2)
    if vertices.isvalid(p1) and vertices.isvalid(p2): #game logic for allowing a road is different from allowing a settlement though
        player = GamePlayer.query.filter(GamePlayer.GameID == game.GameID).filter(GamePlayer.UserID == userid).first()
        if(player.hasResources(models.BuildTypes.ROAD)):
            r = Road(vertex1, vertex2, userid)
            g.roads.append(r)
            g.log({ "action" : "road_built", "args" : [userid, vertex1, vertex2]})

            db_session.commit() # TODO: check if we now have longest road.
                                # Also, I think you can place a road and cut across someone elses road ?

            return add_log("success", id, sequence)
        else:
            return add_log("failure", id, sequence)
    else:
        return add_log("failure", id, sequence)

def development_card(game, userid):
    #check if user has 1 sheep 1 ore 1 wheat
    player = GamePlayer.query.filter(GamePlayer.GameID == game.GameID).filter(GamePlayer.UserID == userid).first()
    if player.hasResources(DEVCARD):
        g = Game.query.get(id)

        card = GameCards.draw()
        player.getCard(card)

        g.log({ "action" : "devcard_bought", "args" : [userid]}) #public
        #g.log({ "action" : "devcard_bought", "args" : [userid, card]}) #private

        return add_log("success", id, sequence)
    else:
        return add_log("failure", id, sequence)

"""
def move_robber():
def discard_cards():
"""
