#!/usr/bin/env python
from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, asynchronous, FallbackHandler
from time import sleep
import json

import database
from catan import app
import controller
from models import Game, log_waiters

database.init_db()

class BlockHandler(RequestHandler):
    @asynchronous
    def get(self):
        #userid = int(self.get_cookie("user"))
        #if we don't mind our game logs being public, we don't even need to look at the userid
        #which brings us to
        #TODO: Make game logs not public
        gameid = int(self.get_argument("game"))
        self.game = Game.query.get(gameid)
        self.sequence = int(self.get_argument("sequence"))

        #Don't try to be strict about > relationship of
        #sequence numbers
        if(self.game.NextSequence != self.sequence):
            #we have data to return now
            self.callback()
        else:
            log_waiters.add(self.callback)

    def callback(self):
        # Client closed connection
        if self.request.connection.stream.closed():
            return

        (nextsequence, log) = controller.get_log(self.game, self.sequence)
        flagged = json.dumps({ "log": "REPLACE_TOKEN", "sequence" : nextsequence })

        self.write(flagged.replace('"REPLACE_TOKEN"', log, 1))
        self.set_header("Content-Type", "application/json")

        self.finish()
        log_waiters.remove(self.callback)

    def on_connection_close(self):
        log_waiters.remove(self.callback)

wsgi_app = WSGIContainer(app)
application = Application([
    (r"/get_log", BlockHandler),
    (r".*", FallbackHandler, dict(fallback=wsgi_app))
])

http_server = HTTPServer(application)
http_server.listen(5000)
IOLoop.instance().start()
