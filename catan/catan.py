from flask import Flask, Response, make_response, request, send_from_directory
app = Flask(__name__)
app.debug = True
#app.config.from_envvar("CATAN_SETTINGS")

import controller
import json

"""
The LogResponse class formats the result of a call together
with the log.

It uses a DIRTY DIRTY HACK to do so.
"""
class LogResponse(Response):
    def __init__(self, game, sequence, response):
        super(Response, self).__init__()
        self.mimetype = "application/json"

        (nextsequence, log) = controller.get_log(game, sequence)

        flagged = json.dumps({ "response": response, "sequence": nextsequence, "log": "REPLACE_TOKEN"});
        self.data = flagged.replace('"REPLACE_TOKEN"', log, 1)

def get_game_prereqs():
    userid = request.args["user"]
    game = controller.get_game(request.args["game"])
    sequence = request.args["sequence"]
    return (userid, game, sequence) if game is not None else None

@app.route("/create_game")
def create_game():
    userid = request.args["user"]
    game = controller.create_game(userid)

    return Response(response=str(game.GameID), mimetype="application/json")

@app.route("/start_game")
def start_game():
    (userid, game, sequence) = get_game_prereqs()
    result = controller.start_game(userid, game)
    return LogResponse(game, sequence, result)

@app.route("/build_settlement")
def build_settlement():
    (userid, game, sequence) = get_game_prereqs()
    result = build_settlement(userid, game, request.args["vertex"])
    return LogResponse(game, sequence, result)

@app.route("/<path:filename>")
def get_file(filename):
    return send_from_directory('../client', filename)

@app.route("/")
def get_index():
    return send_from_directory('../client', "index.html")

if __name__ == "__main__":
    app.run()
