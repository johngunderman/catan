from flask import Flask, Response, make_response, request, send_from_directory, jsonify
app = Flask(__name__)
app.debug = True
#app.config.from_envvar("CATAN_SETTINGS")

import json

import controller
from models import User, GamePlayer

"""
The LogResponse class formats the result of a call together
with the log.

It uses a DIRTY DIRTY HACK to do so.
"""
class LogResponse(Response):
    def __init__(self, player, sequence, response):
        super(Response, self).__init__()
        self.mimetype = "application/json"

        (nextsequence, log) = controller.get_log(player.game, sequence)

        flagged = json.dumps({ "response": response, "sequence": nextsequence, "log": "REPLACE_TOKEN"});
        self.data = flagged.replace('"REPLACE_TOKEN"', log, 1)

def get_player_prereqs():
    userid = int(request.cookies.get("user"))
    gameid = request.args["game"]
    sequence = request.args["sequence"]
    
    player = GamePlayer.query.filter_by(GameID=gameid).filter_by(UserID=userid).one()
    return (player, sequence)

@app.route("/login")
def login():
    #TODO: Perhaps create some user registration flow
    if "user" in request.args:
        userid = int(request.args["user"])
    else:
        userid = controller.create_user()

    resp = Response(response=str(userid), mimetype="application/json")
    resp.set_cookie("user", userid)

    return resp

@app.route("/create_game")
def create_game():
    userid = int(request.cookies.get("user"))
    game = controller.create_game(userid)

    return Response(response=str(game.GameID), mimetype="application/json")

"""
joins an existing game created by create_game.
 - the game will automatically start if the fourt person joined

RETURNS:
    { "response": "failure" } on failure
    { "response": "success", "log".... } on success

This function is peculiar because it returns the log conditionally
"""
@app.route("/join_game")
def join_game():
    userid = int(request.cookies.get("user"))
    gameid = request.args["game"]

    player = controller.join_game(gameid, userid)

    if player is None:
        return jsonify(response="failure")
    else:
        return LogResponse(player, 0, "success")

@app.route("/start_game")
def start_game():
    (player, sequence) = get_player_prereqs()

    result = controller.start_game(player)
    return LogResponse(player, sequence, result)

@app.route("/setup")
def setup():
    (player, sequence) = get_player_prereqs()

    result = controller.setup(player, int(request.args["settlement"]), int(request.args["roadto"]))
    return LogResponse(player, sequence, result)

@app.route("/build_settlement")
def build_settlement():
    (player, sequence) = get_player_prereqs()

    result = controller.build_settlement(player, request.args["vertex"])
    return LogResponse(player, sequence, result)

@app.route("/end_turn")
def end_turn():
    (player, sequence) = get_player_prereqs()

    result = controller.end_turn(player)
    return LogResponse(player, sequence, result)

@app.route("/<path:filename>")
def get_file(filename):
    return send_from_directory('../client', filename)

@app.route("/")
def get_index():
    return send_from_directory('../client', "index.html")

if __name__ == "__main__":
    app.run()
