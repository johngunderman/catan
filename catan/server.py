#!/usr/bin/env python
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import Application, asynchronous, FallbackHandler
from tornado.wsgi import WSGIContainer

from frontend import app
from database import init_db
from loghandler import LogHandler

init_db()

wsgi_app = WSGIContainer(app)
application = Application([
    (r"/get_log", LogHandler),
    (r".*", FallbackHandler, dict(fallback=wsgi_app))
])

http_server = HTTPServer(application)
http_server.listen(8081)
IOLoop.instance().start()
