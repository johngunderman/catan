from sqlalchemy import func
from database import db_session
from models import *
from string import replace

import vertices as v
import hexes as h
import json

def get_log(game, sequence):
    log = [i.Action for i in Log.query.filter(Log.GameID == game.GameID).filter(Log.Sequence >= sequence).all()]
    return (game.NextSequence, "[" + ",".join(log) + "]")

"""
Creates a user account.

Since there is currently no authentication, this is somewhat straightforward
"""
def create_user():
    u = User()

    db_session.add(u)
    db_session.commit()
    return u

"""
Creates a new game.  The requesting user is automatically part of the game.
"""
def create_game(user):
    game = Game()

    user.join_game(game)

    db_session.add(game);
    db_session.commit()
    return game

def join_game(game, user):
    if (
        #the game hasn't started yet
        game.State == Game.States.NOTSTARTED and

        #the user isn't already in the game
        GamePlayer.query. \
            filter_by(GameID=game.GameID). \
            filter_by(UserID=user.UserID). \
            count() == 0 and

        #there aren't already four players
        len(game.players) < 4
    ):
        player = user.join_game(game)

        #the game automatically starts when four players have joined
        if len(game.players) == 4:
            game.start()
            log_state_change(game)

        db_session.commit()
        return player
    else:
        return None

def start_game(player):
    game = player.game
    if(
        #the game hasn't started yet
        game.State == Game.States.NOTSTARTED and

        #there are at least three players
        len(game.players) >= 3
    ):
        game.start()
        #TODO: consider creating a turn_ended to replace log_state_change
        log_state_change(game)

        db_session.commit()
        return "success"
    else:
        return "failure"

"""
Checks whether it is this player's turn during normal play
"""
def players_turn(player):
    return \
        player.game.State == Game.States.NORMAL_PLAY and \
        player.game.CurrentPlayerID == player.UserID

def build_settlement(player, p):
    #TODO: make sure decompress checks validity
    vertex = v.decompress(p)

    if (
        players_turn(player) and

        #there are no settlements within the distance rule
        Settlement.distance_rule(player.GameID, vertex) and

        #and the player has a road to the vertex
        player.roads_q().count() > 0 and #FIXME

        #and the player has the requisite resources
        player.hasResourcesFor(BuildTypes.TOWN)
    ) :
        player.takeResourcesFor(BuildTypes.TOWN)
        #Actually, I think it would be better to just have add_settlement written here inline
        player.add_settlement(p)
        player.Score += 1
        player.game.log(Log.settlement_built(player, s))
        player.checkVictory()


        db_session.commit()

        return "success"
    else:
        return "failure"

def upgrade_settlement(player, vertex):
    existing_settlement = Settlement.query.get((player.GameID, vertex)).filter_by(UserID=player.UserID).first()
    if (
        #we are in the normal play state
        game.State == Game.States.NORMAL_PLAY and

        #the player already has a settlement here
        existing_settlement is not None and

        #the player has the necessary resources
        player.hasResourcesFor(BuildTypes.CITY)
    ) :
        existing_settlement.Type = Settlement.CITY
        player.takeResourcesFor(BuildTypes.CITY)
        player.Score += 1
        player.game.log(Log.settlement_upgraded(player.UserID, vertex))
        player.checkVictory()

        db_session.commit()

        return "success"
    else:
        return "failure"

def build_road(player, vertex1, vertex2):
    if vertex2 < vertex1:
        (vertex1, vertex2) = (vertex2, vertex1)
    
    if (
        #the player has the resources
        player.hasResourcesFor(BuildTypes.ROAD) and

        #both vertices are valid
        v.isvalid(v.decompress(vertex1)) and
        v.isvalid(v.decompress(vertex2)) and

        #no other roads overlap
        Road.overlaps_q(player, vertex1, vertex2).count() == 0 and

        #the player has a road at one of the vertices already
        player.road_meets_q(vertex1, vertex2).count() != 0
    ) :

        player.takeResourcesFor(BuildTypes.ROAD)
        r = Road(player.UserID, vertex1, vertex2)
        player.game.roads.append(r)
        player.game.log(Log.road_built(player, r))

        # TODO: check if we now have longest road.
        # It is a longest path problem.  Check the rules before implementing

        db_session.commit()

        return "success"
    else:
        return "failure"

def move_robber(player, to, stealfrom):
    game = player.game
    if not (
        #We're supposed to be moving the robber
        game.State == Game.States.MOVE_ROBBER and

        #this player is supposed to be moving the robber
        player.UserID == game.CurrentPlayerID and

        #the robber isn't being moved nowhere
        game.RobberHex != to and

        #the place where the robber is being moved is valid
        to in h.valid_hexes
    ) :
        return "failure"
 
    v1 = v.decompress(to)
    adjacent_vertices = map(v.compress, h.adjacent(v1))

    vulnerable_players = db_session.query(Settlement.UserID). \
        filter_by(GameID=game.GameID). \
        filter(Settlement.Vertex.in_(adjacent_vertices)). \
        filter(Settlement.UserID != player.UserID). \
        all()

    if (len(vulnerable_players) == 0 and stealfrom is None) or (stealfrom,) in vulnerable_players:
        game.RobberHex = to
        game.State = Game.States.NORMAL_PLAY

        if stealfrom is not None:
            pass #TODO

        game.log(Log.robber_moved(player.UserID, to))
        game.log(Log.req_turn(player.UserID))
        db_session.commit()
        return "success"
    else:
        return "failure"

"""
The setup RPC is called during the setup phase, to set up
an initial settlement and road.

settlement_vertex: the vertex where the settlement should be put
road_to: one of the vertices for the new road
    the other vertex is that of the settlement
"""
def setup(player, settlement_vertex, road_to):
    game = player.game
    settlement_v = v.decompress(settlement_vertex)
    road_v = v.decompress(road_to)
    if (
        #we're setting up
        game.State in [Game.States.SETUP_FORWARD, Game.States.SETUP_BACKWARD] and
        #it's the player's turn
        player.UserID == game.CurrentPlayerID and

        #the settlement vertex is valid
        v.isvalid(settlement_v) and

        #the new settlement conforms to the distance rule
        Settlement.distance_rule(player.GameID, settlement_v) and

        #the road vertex is adjacent to the settlement (and valid)
        road_v in v.adjacent(settlement_v)

        #we don't have to check for existing roads,
        #because there can't be any, by the distance rule
    ):
        s = player.add_settlement(settlement_vertex)
        
        r = player.add_road(settlement_vertex, road_to)

        player.Score += 2

        game.log(Log.setup(player, settlement_vertex, road_to))

        if game.State == Game.States.SETUP_FORWARD:
            if game.CurrentIndex + 1 == len(game.players):
                #time to go backwards
                game.State = Game.States.SETUP_BACKWARD
            else:
                game.CurrentIndex += 1

        elif game.State == Game.States.SETUP_BACKWARD:
            #TODO: A naming schema for compressed/uncompressed vertices (Hungarian Notation FTW!)

            adjacent = map(v.compress, v.adjacent_hexes(settlement_v))
            cards = db_session.query(Hex.Type, func.count()). \
                filter_by(GameID=game.GameID). \
                filter(Hex.Vertex.in_(adjacent)). \
                filter(Hex.Type != Terrain.DESERT). \
                group_by(Hex.Type). \
                all()

            player.add_cards([(j, i) for (i, j) in cards])

            if game.CurrentIndex == 0:
                #setup is over, welcome to the real world, Neo
                game.State = Game.States.NORMAL_PLAY
            else:
                game.CurrentIndex -= 1

        game.CurrentPlayerID = game.players[game.CurrentIndex].UserID
        log_state_change(game)

        db_session.commit()
        return "success"
    else:
        return "failure"

def end_turn(player):
    game = player.game
    if players_turn(player):
        game.CurrentIndex += 1

        if game.CurrentIndex == len(game.players):
            game.CurrentIndex = 0

        game.CurrentPlayerID = game.players[game.CurrentIndex].UserID
        log_state_change(player.game)
        db_session.commit()

        return "success"
    else:
        return "failure"

def log_state_change(game):
    if game.State == Game.States.SETUP_FORWARD or game.State == Game.States.SETUP_BACKWARD:
        game.log(Log.req_setup(game.CurrentPlayerID))
    elif game.State == Game.States.NORMAL_PLAY:
        game.begin_turn()
