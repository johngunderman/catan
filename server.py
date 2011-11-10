from tornado.wsgi import WSGIContainer
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.web import RequestHandler, Application, asynchronous, FallbackHandler
from catan import app
from time import sleep

waiters = set()

class BlockHandler(RequestHandler):
    @asynchronous
    def get(self):
	waiters.add(self.callback)
        print("Exiting from async.")

    def callback(self, result):
        # Closed client connection
        if self.request.connection.stream.closed():
            return
        self.finish(result)

    def on_connection_close(self):
        waiters.remove(self.callback)

class ReleaseHandler(RequestHandler):
    def get(self):
        self.write("{0} waiting requests released".format(len(waiters)))
        for callback in waiters:
            callback(self.request.remote_ip)

wsgi_app = WSGIContainer(app) 
application = Application([
    (r"/block", BlockHandler),
    (r"/unblock", ReleaseHandler),
    (r".*", FallbackHandler, dict(fallback=wsgi_app))
])

http_server = HTTPServer(application)
http_server.listen(5000)
IOLoop.instance().start()



