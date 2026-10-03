"""Frame validation for the browser <-> bridge WebSocket protocol."""
import json
from typing import Any, Awaitable, Callable, Protocol


class ProtocolError(ValueError):
    pass


class MeshPort(Protocol):
    async def start(self, on_event: Callable[[dict], Awaitable[None]]) -> None: ...
    async def send(self, id: str, to: str, content: str) -> None: ...
    async def stop(self) -> None: ...


def _require_str(frame: dict[str, Any], key: str) -> str:
    value = frame.get(key)
    if not isinstance(value, str) or not value:
        raise ProtocolError(f"'{key}' must be a non-empty string")
    return value


def parse_command(raw: str | bytes) -> dict[str, Any]:
    try:
        frame = json.loads(raw)
    except (TypeError, ValueError) as exc:
        raise ProtocolError("frame is not valid JSON") from exc
    if not isinstance(frame, dict):
        raise ProtocolError("frame must be an object")
    kind = frame.get("type")
    if kind == "send_message":
        for key in ("id", "to", "content"):
            _require_str(frame, key)
    elif kind != "get_peers":
        raise ProtocolError(f"unknown command type: {kind!r}")
    return frame
