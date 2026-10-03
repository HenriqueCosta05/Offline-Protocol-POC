"""Loopback WebSocket server exposing a MeshPort to the browser."""
import asyncio
import json
import logging
from typing import Iterable

from websockets.asyncio.server import ServerConnection, serve as ws_serve
from websockets.datastructures import Headers
from websockets.http11 import Request, Response

from .protocol import MeshPort, ProtocolError, parse_command

log = logging.getLogger("bridge")
DEFAULT_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")


async def serve(
    mesh: MeshPort,
    host: str = "127.0.0.1",
    port: int = 8765,
    allowed_origins: Iterable[str] = DEFAULT_ORIGINS,
):
    origins = set(allowed_origins)
    clients: set[ServerConnection] = set()

    # Mesh state announced before a browser connects (or while it was away).
    identity: dict | None = None
    peers: dict[str, dict] = {}

    def snapshot() -> list[dict]:
        return ([identity] if identity else []) + list(peers.values())

    async def broadcast(event: dict) -> None:
        nonlocal identity
        if event.get("type") == "identity":
            identity = event
        elif event.get("type") == "neighbor_discovered":
            peers[event["id"]] = event
        elif event.get("type") == "neighbor_lost":
            peers.pop(event["id"], None)
        payload = json.dumps(event)
        await asyncio.gather(*(c.send(payload) for c in list(clients)), return_exceptions=True)

    def check_origin(connection: ServerConnection, request: Request):
        if request.headers.get("Origin") not in origins:
            return Response(403, "Forbidden", Headers([("Content-Type", "text/plain")]), b"origin not allowed\n")
        return None

    async def handler(ws: ServerConnection) -> None:
        clients.add(ws)
        for event in snapshot():
            await ws.send(json.dumps(event))
        try:
            async for raw in ws:
                try:
                    cmd = parse_command(raw)
                except ProtocolError as exc:
                    await ws.send(json.dumps({"type": "error", "code": "bad_frame", "message": str(exc)}))
                    continue
                if cmd["type"] == "get_peers":
                    for event in peers.values():
                        await ws.send(json.dumps(event))
                elif cmd["type"] == "send_message":
                    try:
                        await mesh.send(cmd["id"], cmd["to"], cmd["content"])
                    except Exception as exc:  # surface SDK failures to the UI
                        log.exception("send failed")
                        await broadcast({"type": "delivery_status", "id": cmd["id"], "status": "failed"})
                        await ws.send(json.dumps({"type": "error", "code": "send_failed", "message": str(exc)}))
        finally:
            clients.discard(ws)

    await mesh.start(broadcast)
    return await ws_serve(handler, host, port, process_request=check_origin)
