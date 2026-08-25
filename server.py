from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os
import threading
import time
from datetime import datetime

DAILY_IMPORT_HOUR = 4
DAILY_IMPORT_MINUTE = 30


def run_daily_import():
    now = datetime.now()
    print(f"[scheduler] Daily import triggered at {now.strftime('%Y-%m-%d %H:%M:%S')}")

    data_file = Path('data.json')
    if data_file.exists():
        try:
            contents = data_file.read_text(encoding='utf-8')
            print(f"[scheduler] data.json loaded successfully ({len(contents)} bytes)")
        except Exception as exc:
            print(f"[scheduler] data.json read failed: {exc}")
    else:
        print('[scheduler] data.json not found; import cannot continue.')


class DailyImportScheduler(threading.Thread):
    def __init__(self, hour=DAILY_IMPORT_HOUR, minute=DAILY_IMPORT_MINUTE, poll_seconds=30):
        super().__init__(daemon=True)
        self.hour = hour
        self.minute = minute
        self.poll_seconds = poll_seconds
        self._has_run_today = False

    def run(self):
        while True:
            now = datetime.now()
            is_target_time = now.hour == self.hour and now.minute == self.minute

            if is_target_time:
                if not self._has_run_today:
                    run_daily_import()
                    self._has_run_today = True
            else:
                self._has_run_today = False

            time.sleep(self.poll_seconds)


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
    scheduler = DailyImportScheduler()
    scheduler.start()
    print('Serving at http://127.0.0.1:5500')
    print('Daily import scheduler active for 04:30 each day.')
    server = ThreadingHTTPServer(('127.0.0.1', 5500), SpaHandler)
    server.serve_forever()
