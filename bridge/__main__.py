import argparse
import asyncio
from pathlib import Path

from .manager import FakeMesh, SdkMesh
from .server import serve


async def main() -> None:
    p = argparse.ArgumentParser(prog="bridge")
    p.add_argument("--fake", action="store_true", help="loopback mesh, no SDK needed")
    p.add_argument("--user-id", default="web-user")
    p.add_argument("--app-id", default="offline-web")
    p.add_argument("--state-root", default=".bridge-state")
    p.add_argument("--port", type=int, default=8765)
    a = p.parse_args()
    mesh = FakeMesh() if a.fake else SdkMesh(a.app_id, a.user_id, Path(a.state_root))
    server = await serve(mesh, port=a.port)
    print(f"bridge listening on ws://127.0.0.1:{a.port} ({'fake' if a.fake else 'sdk'})")
    await server.serve_forever()


if __name__ == "__main__":
    asyncio.run(main())
