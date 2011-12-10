from database import db_session
from models import *
import json

def start_game(id, sequence):
    g = Game(); #This will eventually be done earlier, like in create_game()
    g.start();
    
    sequence = Log.query.count() #This needs to be not what it is right now.  Make MySQL do it?
    g.log.append(
        Log(sequence, json.dumps({ "action" : "hexes_placed", "args": [i.json() for i in g.hexes]}))
    )

    db_session.add(g);
    db_session.commit();

    return {"result": "success", "log": [i.Action for i in Log.query.filter(Log.Sequence >= sequence).all()]}

def build_settlement(userid, position):
    g = Game();

    g.Settlement.UserID = userid
    g.Settlement.GameID = this.gameid # ??
    g.Settlement.Type = 1
    g.Settlement.Vertex = position

    sequence = Log.query.count();
    g.log.append(
        Log(sequence, json.dumps({ "action" : "settlement_built", "args": [userid, position]}))
    )

    db_session.add(g);
    db_session.commit();

    
