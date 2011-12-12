from flask import Flask, Response, make_response, request
app = Flask(__name__)
app.debug = True
#app.config.from_envvar("CATAN_SETTINGS")

import controller
import json

class LogResponse(Response):
    def __init__(self,gameid, sequence, response):
        super(Response, self).__init__()
        self.mimetype = "application/json"

        (nextsequence, log) = controller.get_log(gameid, sequence)

        flagged = json.dumps({ "response": response, "sequence": nextsequence, "log": "REPLACE_TOKEN"});
        self.data = flagged.replace('"REPLACE_TOKEN"', log, 1)

@app.route("/create_game")
def create_game():
    userid = request.args["user"]
    gameid = controller.create_game(userid)

    return LogResponse(gameid, 0, "success") 

@app.route("/start_game")
def start_game():
    #TODO: consider creating a get_prereqs function
    gameid = request.args["game"]
    userid = request.args["user"]
    sequence = request.args["sequence"]
    return LogResponse(gameid, sequence, controller.start_game(gameid, userid))

if __name__ == "__main__":
    app.run()
