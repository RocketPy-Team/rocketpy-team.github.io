#!/usr/bin/env python3
"""Local dev-server manager for the RocketPy static site.

Cross-platform (Windows / macOS / Linux) so the Makefile targets behave the
same regardless of whether `make` runs recipes through cmd.exe or a POSIX
shell. Starts `python -m http.server` detached, tracks it via a PID file, and
can stop/restart it.

Usage:
    python scripts/devserver.py {start|stop|restart|status}

Environment:
    PORT   port to serve on (default: 8000)
    HOST   address to bind   (default: 127.0.0.1)
"""

import os
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PID_FILE = ROOT / ".devserver.pid"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
IS_WIN = os.name == "nt"


def port_open():
    """True if something is already accepting connections on HOST:PORT."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.4)
        return sock.connect_ex((HOST, PORT)) == 0


def read_pid():
    try:
        return int(PID_FILE.read_text().strip())
    except (FileNotFoundError, ValueError):
        return None


def _urls():
    base = f"http://{HOST}:{PORT}"
    return base, f"{base}/index.html", f"{base}/about.html"


def start():
    if port_open():
        base, index, about = _urls()
        print(f"Server already running at {base}")
        print(f"  Landing: {index}")
        print(f"  About:   {about}")
        return

    args = [sys.executable, "-m", "http.server", str(PORT), "--bind", HOST]
    kwargs = {
        "cwd": str(ROOT),
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if IS_WIN:
        # DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP -> survives make exiting.
        kwargs["creationflags"] = 0x00000008 | 0x00000200
    else:
        kwargs["start_new_session"] = True

    proc = subprocess.Popen(args, **kwargs)
    PID_FILE.write_text(str(proc.pid))

    for _ in range(30):
        if port_open():
            break
        time.sleep(0.1)
    else:
        print("Server did not come up in time; check for errors.", file=sys.stderr)
        sys.exit(1)

    base, index, about = _urls()
    print(f"Server started at {base}  (pid {proc.pid})")
    print(f"  Landing: {index}")
    print(f"  About:   {about}")


def stop():
    pid = read_pid()
    killed = False
    if pid is not None:
        if IS_WIN:
            result = subprocess.run(
                ["taskkill", "/PID", str(pid), "/F", "/T"],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            killed = result.returncode == 0
        else:
            try:
                os.kill(pid, signal.SIGTERM)
                killed = True
            except OSError:
                killed = False

    if PID_FILE.exists():
        PID_FILE.unlink()

    # Wait for the socket to be released so a following start() is reliable.
    for _ in range(20):
        if not port_open():
            break
        time.sleep(0.1)

    if killed:
        print(f"Server stopped (pid {pid}).")
    else:
        print("No running server found (nothing to stop).")


def restart():
    stop()
    start()


def status():
    base, index, about = _urls()
    state = "RUNNING" if port_open() else "stopped"
    print(f"Server is {state} at {base}")
    if state == "RUNNING":
        print(f"  Landing: {index}")
        print(f"  About:   {about}")


COMMANDS = {"start": start, "stop": stop, "restart": restart, "status": status}


def main():
    command = sys.argv[1] if len(sys.argv) > 1 else "status"
    action = COMMANDS.get(command)
    if action is None:
        print(f"Unknown command: {command}", file=sys.stderr)
        print(f"Usage: python {Path(__file__).name} {{{'|'.join(COMMANDS)}}}", file=sys.stderr)
        sys.exit(1)
    action()


if __name__ == "__main__":
    main()
