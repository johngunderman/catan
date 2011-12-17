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
class JsonResponse(Response):
    def __init__(self, response):
        super(Response, self).__init__()
        self.mimetype = "application/json"
        self.data = json.dumps(response)

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

    return JsonResponse("success" if player is not None else "failure")

@app.route("/start_game")
def start_game():
    player = get_player_prereqs()

    result = controller.start_game(player)
    return JsonResponse(result)

@app.route("/setup")
def setup():
    player = get_player_prereqs()

    result = controller.setup(player, int(request.args["settlement"]), int(request.args["roadto"]))
    return JsonResponse(result)

@app.route("/build_settlement")
def build_settlement():
    player = get_player_prereqs()

    result = controller.build_settlement(player, request.args["vertex"])
    return JsonResponse(result)

@app.route("/end_turn")
def end_turn():
    player = get_player_prereqs()

    result = controller.end_turn(player)
    return JsonResponse(result)

@app.route("/<path:filename>")
def get_file(filename):
    return send_from_directory('../client', filename)

@app.route("/")
def get_index():
    return send_from_directory('../client', "index.html")

if __name__ == "__main__":
    app.run()
