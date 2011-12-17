from frontend import log_waiters
from models import Game
from tornado.web import asynchronous, RequestHandler

import controller
import json

class LogHandler(RequestHandler):
    @asynchronous
    def get(self):
        print(self)
        #userid = int(self.get_cookie("user"))
        #if we don't mind our game logs being public, we don't even need to look at the userid
        #which brings us to
        #TODO: Make game logs not public
        gameid = int(self.get_argument("game"))
        self.game = Game.query.get(gameid)
        self.sequence = int(self.get_argument("sequence"))

        if not self.game.GameID in log_waiters:
            log_waiters[self.game.GameID] = set()
        log_waiters[self.game.GameID].add(self.callback)

        #Don't try to be strict about > relationship of
        #sequence numbers
        if(self.game.NextSequence != self.sequence):
            #we have data to return now
            self.callback()
            
    def callback(self):
        # Client closed connection
        if self.request.connection.stream.closed():
            return

        (nextsequence, log) = controller.get_log(self.game, self.sequence)
        flagged = json.dumps({ "log": "REPLACE_TOKEN", "sequence" : nextsequence })

        self.write(flagged.replace('"REPLACE_TOKEN"', log, 1))
        self.set_header("Content-Type", "application/json")

        print("Pre-finish")
        self.finish()
        print("Post finish")
        log_waiters[self.game.GameID].remove(self.callback)

    def on_connection_close(self):
        print("Finished")
        log_waiters[self.game.GameID].remove(self.callback)
