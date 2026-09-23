#!/usr/bin/env python3
"""
WikiVision v1.0-beta — Lightweight Development & Production Static Server
Zero external dependencies. Powered by Python 3 standard library.
"""

import argparse
import http.server
import os
import socket
import socketserver
import sys

# Ensure UTF-8 output encoding on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

DEFAULT_PORT = 8080
DEFAULT_HOST = "0.0.0.0"
DIRECTORY = os.path.dirname(os.path.abspath(__file__))


def get_local_ip() -> str:
    """Returns the primary non-loopback local IPv4 address of the host machine."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    HTTP Request handler that disables browser caching during development
    and injects essential security headers for PWA assets.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

    def log_message(self, format, *args):
        """Clean single-line request logging."""
        sys.stderr.write(f"[{self.log_date_time_string()}] {args[0]} - {args[1]}\n")


def parse_args():
    parser = argparse.ArgumentParser(
        description="WikiVision v1.0-beta Web Reader Server"
    )
    parser.add_argument(
        "-p", "--port",
        type=int,
        default=int(os.environ.get("PORT", DEFAULT_PORT)),
        help=f"Port to bind the HTTP server to (default: {DEFAULT_PORT})"
    )
    parser.add_argument(
        "-H", "--host",
        type=str,
        default=DEFAULT_HOST,
        help=f"Host address to bind to (default: {DEFAULT_HOST})"
    )
    return parser.parse_args()


def main():
    args = parse_args()
    port = args.port
    host = args.host
    local_ip = get_local_ip()

    socketserver.TCPServer.allow_reuse_address = True

    try:
        with socketserver.TCPServer((host, port), NoCacheHTTPRequestHandler) as httpd:
            print("=" * 64)
            print("  WikiVision v1.0-beta — AI Smart Wikipedia Reader")
            print("=" * 64)
            print(f"  * Local:    http://localhost:{port}/")
            if local_ip != "127.0.0.1":
                print(f"  * Network:  http://{local_ip}:{port}/")
            print(f"  * Root:     {DIRECTORY}")
            print("=" * 64)
            print("  Press Ctrl+C to stop the server\n")
            sys.stdout.flush()
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n[WikiVision] Server shutdown requested. Goodbye!")
        sys.exit(0)
    except OSError as err:
        print(f"\n[-] Error: Could not bind to port {port}: {err}")
        print("    Try running with a different port: python server.py --port 8081")
        sys.exit(1)


if __name__ == "__main__":
    main()
