from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

class SpaHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split('?', 1)[0]
        if path.startswith('/api/') or path.startswith('/admin/'):
            return super().do_GET()

        if '.' in Path(path).name:
            return super().do_GET()

        index_path = Path('index.html').resolve()
        if index_path.exists():
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(index_path.read_bytes())
            return

        return super().do_GET()

    def log_message(self, format, *args):
        return

if __name__ == '__main__':
    os.chdir(Path(__file__).resolve().parent)
    server = ThreadingHTTPServer(('127.0.0.1', 5500), SpaHandler)
    print('Serving at http://127.0.0.1:5500')
    server.serve_forever()
