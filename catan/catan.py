from flask import Flask, Response, make_response, request, send_from_directory
app = Flask(__name__)
app.debug = True
#app.config.from_envvar("CATAN_SETTINGS")

import json

import controller
import database
import models

database.init_db()

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
    userid = request.args["user"]
    gameid = request.args["game"]
    sequence = request.args["sequence"]
    
    player = models.GamePlayer.query.filter_by(GameID=gameid).filter_by(UserID=userid).one()
    return (player, sequence)

@app.route("/create_game")
def create_game():
    userid = request.args["user"]
    game = controller.create_game(userid)

    return Response(response=str(game.GameID), mimetype="application/json")

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

    result = build_settlement(player, request.args["vertex"])
    return LogResponse(player, sequence, result)

@app.route("/<path:filename>")
def get_file(filename):
    return send_from_directory('../client', filename)

@app.route("/")
def get_index():
    return send_from_directory('../client', "index.html")

if __name__ == "__main__":
    app.run()
