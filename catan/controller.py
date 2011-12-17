from database import db_session
from models import *
from string import replace

import vertices as v
import hexes
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

def build_settlement(player, vertex):
    game = player.game
    #TODO: make sure decompress checks validity
    p = v.decompress(vertex)

    if (
        players_turn(player) and

        #there are no settlements within the distance rule
        Settlement.distance_rule(player.GameID, vertex) and

        #and the player has a road to the vertex
        player.roads_q().count() > 0 and

        #and the player has the requisite resources
        player.hasResources(BuildTypes.TOWN)
    ) :
        s = Settlement(vertex, Settlement.TOWN)
        player.settlements.append(s)
        player.takeResources(BuildTypes.TOWN)
        game.log(Log.settlement_built(userid, vertex))

        db_session.commit()

        return "success"
    else:
        return "failure"

def upgrade_settlement(player, vertex):
    existing_settlement = Settlement.query.get((player.GameID, vertex)).filter_by(UserID=player.UserID).first()
    if (
        #we are in the normal play state
        game.State == Game.States.NORMAL_PLAY and

        #

        #the player already has a settlement here
        existing_settlement is not None and

        #the player has the necessary resources
        player.hasCardsFor(BuildTypes.CITY)
    ) :

        existing_settlement.Type = Settlement.CITY
        player.takeResources(BuildTypes.CITY)
        player.game.log(Log.settlement_upgraded(player.UserID, vertex))

        db_session.commit()

        return "success"
    else:
        return "failure"

def build_road(player, vertex1, vertex2):
    if vertex2 < vertex1:
        (vertex1, vertex2) = (vertex2, vertex1)
    p1 = v.decompress(vertex1)
    p2 = v.decompress(vertex2)
    vertices = (vertex1, vertex2)
    if (
        #the player has the resources
        player.hasResources(BuildTypes.ROAD) and
        #both vertices are valid
        v.isvalid(p1) and v.isvalid(p2) and
        #no other roads overlap
        Road.query. \
            filter_by(GameID=player.GameID). \
            filter_by(Vertex1=vertex1). \
            filter_by(Vertex2=vertex2). \
            count() == 0
        and

        #the player has a road at one of the vertices already
        player.roads_q(). \
            filter(or_(
                in_(Road.Vertex1, vertices),
                in_(Road.Vertex2, vertices)
            )).count() != 0
    ) :

        player.takeResources(BuildTypes.ROAD)
        r = Road(vertex1, vertex2, userid)
        g.roads.append(r)
        g.log({ "action" : "road_built", "args" : [userid, vertex1, vertex2]})

        # TODO: check if we now have longest road.
        # It is a longest path problem.  Check the rules before implementing

        db_session.commit()

        return "success"

    else:
        return "failure"

"""def development_card(player):
    if player.hasResources(BuildTypes.DEVCARD):
        card = player.game.cards.drawDevCard();

        player.getCard(card)

        g.log({ "action" : "devcard_bought", "args" : [userid, card]}) #private

        return add_log("success", id, sequence)
    else:
        return add_log("failure", id, sequence)
"""

def move_robber(player, tile):
    game = player.game
    if (
        #We're supposed to be moving the robber
        game.State == States.MOVE_ROBBER and

        #this player is supposed to be moving the robber
        player.UserID == game.CurrentPlayerID and

        #the robber isn't being moved nowhere
        game.RobberVertex != tile and

        #the place where the robber is being moved is valid
        tile in valid_hexes
    ) :
        game.RobberTile = tile
        game.State = States.STEAL_CARDS

        p = vertices.decompress(tile)
        adj = tiles.adjacent(p)

        vulnerable_players = \
            Settlement.query. \
            filter_by(GameID=player.GameID). \
            filter(Settlement.Vertex.in_(adj)). \
            group_by(Settlement.UserID). \
            having(Settlement.UserID != player.UserID)

        game.State = States.STEAL_CARDS
        return vulnerable_players
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
        s = Settlement(player.UserID, settlement_vertex)
        game.settlements.append(s)

        r = Road(player.UserID, settlement_vertex, road_to)
        game.roads.append(r)

        if game.State == Game.States.SETUP_FORWARD:
            if game.CurrentIndex + 1 == len(game.players):
                #time to go backwards
                game.State = Game.States.SETUP_BACKWARD
            else:
                game.CurrentIndex += 1

        elif game.State == Game.States.SETUP_BACKWARD:
            #TODO: A naming schema for compressed/uncompressed vertices (Hungarian Notation FTW!)
            adjacent = map(v.compress, v.adjacent_hexes(settlement_v))
            cards = db_session.query(Hex.Type). \
                filter_by(GameID=game.GameID). \
                filter(Hex.Vertex.in_(adjacent)). \
                all()

            game.log(Log.got_resources(player.UserID, cards))

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
            game.TurnCount += 1

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
        game.begin_turn(game)
        game.log(Log.req_turn(game.CurrentPlayerID))
