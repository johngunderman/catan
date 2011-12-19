from flask import Flask, Response, make_response, request, send_from_directory, jsonify
app = Flask(__name__)
app.debug = True
#app.config.from_envvar("CATAN_SETTINGS")

import json

import controller
from models import User, GamePlayer, Game

log_waiters = {}

"""
The LogResponse class formats the result of a call together
with the log.

It uses a DIRTY DIRTY HACK to do so.
"""
class JsonResponse(Response):
    def __init__(self, response):
        super(Response, self).__init__()
        self.mimetype = "application/json"
        self.data = json.dumps(response)


def flush_log(id):
    if id in log_waiters:
        for i in list(log_waiters[id]):
            i()

def get_player_prereqs():
    userid = int(request.cookies.get("user"))
    gameid = request.args["game"]

    return GamePlayer.query.filter_by(GameID=gameid).filter_by(UserID=userid).one()

@app.route("/login")
def login():
    #TODO: Perhaps create some user registration flow
    if "user" in request.args:
        user = User.query.get(int(request.args["user"]))
    else:
        user = controller.create_user()

    resp = Response(response="success", mimetype="application/json")
    resp.set_cookie("user", user.UserID)

    return resp

@app.route("/create_game")
def create_game():
    userid = int(request.cookies.get("user"))
    user = User.query.get(userid)
    game = controller.create_game(user)

    return JsonResponse(game.GameID)

"""
joins an existing game created by create_game.
 - the game will automatically start if the fourt person joined
"""
@app.route("/join_game")
def join_game():
    userid = int(request.cookies.get("user"))
    gameid = request.args.get("game")
    game = Game.query.get(gameid)
    user = User.query.get(userid)

    player = controller.join_game(game, user)

    flush_log(game.GameID)

    return JsonResponse("success" if player is not None else "failure")

@app.route("/start_game")
def start_game():
    player = get_player_prereqs()

    result = controller.start_game(player)

    flush_log(player.GameID)
    return JsonResponse(result)

@app.route("/setup")
def setup():
    player = get_player_prereqs()

    result = controller.setup(player, int(request.args["settlement"]), int(request.args["roadto"]))

    flush_log(player.GameID)
    return JsonResponse(result)

@app.route("/build_settlement")
def build_settlement():
    player = get_player_prereqs()

    result = controller.build_settlement(player, request.args["vertex"])

    flush_log(player.GameID)
    return JsonResponse(result)

@app.route("/move_robber")
def move_robber():
    player = get_player_prereqs()
    moveto = int(request.args.get("moveto"))
    stealfrom = request.args.get("stealfrom")
    if stealfrom is not None:
        stealfrom = int(stealfrom)

    result = controller.move_robber(player, moveto, stealfrom)

    flush_log(player.GameID)
    return JsonResponse(result)

@app.route("/end_turn")
def end_turn():
    player = get_player_prereqs()

    result = controller.end_turn(player)

    flush_log(player.GameID)
    return JsonResponse(result)

@app.route("/<path:filename>")
def get_file(filename):
    return send_from_directory('../client', filename)

@app.route("/")
def get_index():
    return send_from_directory('../client', "index.html")

if __name__ == "__main__":
    app.run()
