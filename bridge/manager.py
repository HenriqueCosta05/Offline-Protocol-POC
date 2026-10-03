"""SDK adapter: the only module that imports offline_protocol_sdk."""
import asyncio
import time
import uuid
from pathlib import Path
from typing import Awaitable, Callable

EventSink = Callable[[dict], Awaitable[None]]


class SdkMesh:
    """MeshPort backed by the real Offline Protocol desktop bindings.

    Event names and fields follow the SDK README. They are untested against a
    live mesh, so adjust `_translate` if the installed bindings differ.
    """

    def __init__(self, app_id: str, user_id: str, state_root: Path):
        self._app_id, self._user_id, self._state_root = app_id, user_id, state_root
        self._pm = None
        self._sink: EventSink | None = None
        self._loop: asyncio.AbstractEventLoop | None = None

    async def start(self, on_event: EventSink) -> None:
        from offline_protocol_sdk import ProtocolManager  # lazy: needs a source build
        from offline_protocol_sdk.offline_protocol import ProtocolConfig

        self._sink, self._loop = on_event, asyncio.get_running_loop()
        config = ProtocolConfig(app_id=self._app_id, user_id=self._user_id, encryption_enabled=True)
        self._pm = ProtocolManager(config, event_handler=self._on_sdk_event, state_root=self._state_root)
        await self._pm.__aenter__()
        await self._pm.start()
        await on_event({"type": "identity", "address": self._user_id})

    def _on_sdk_event(self, event) -> None:
        frame = self._translate(event)
        if frame and self._sink and self._loop:
            asyncio.run_coroutine_threadsafe(self._sink(frame), self._loop)

    @staticmethod
    def _translate(event) -> dict | None:
        data = event if isinstance(event, dict) else getattr(event, "__dict__", {})
        kind = str(data.get("type") or type(event).__name__)
        if kind in ("message_received", "MessageReceived"):
            return {
                "type": "message_received",
                "id": str(data.get("id", uuid.uuid4())),
                "from": str(data.get("sender") or data.get("from")),
                "content": str(data.get("content", "")),
                "ts": int(data.get("ts", time.time() * 1000)),
            }
        if kind in ("neighbor_discovered", "NeighborDiscovered"):
            return {
                "type": "neighbor_discovered",
                "id": str(data.get("peer_id") or data.get("id")),
                "transport": str(data.get("transport", "unknown")),
                "rssi": data.get("rssi"),
            }
        if kind in ("neighbor_lost", "NeighborLost"):
            return {"type": "neighbor_lost", "id": str(data.get("peer_id") or data.get("id"))}
        if kind in ("delivery_status", "MessageDelivered", "MessageFailed"):
            failed = "fail" in kind.lower() or data.get("status") == "failed"
            return {
                "type": "delivery_status",
                "id": str(data.get("message_id") or data.get("id")),
                "status": "failed" if failed else "delivered",
            }
        return None

    async def send(self, id: str, to: str, content: str) -> None:
        await self._pm.send_message(to, content)

    async def stop(self) -> None:
        if self._pm:
            await self._pm.stop()
            await self._pm.close()


class FakeMesh:
    """Loopback mesh for local demos: reports delivery, then echoes the message back."""

    async def start(self, on_event: EventSink) -> None:
        self._emit = on_event
        await on_event({"type": "identity", "address": "me-local"})
        await on_event({"type": "neighbor_discovered", "id": "echo-bot", "transport": "ble", "rssi": -52})

    async def send(self, id: str, to: str, content: str) -> None:
        await asyncio.sleep(0.2)
        await self._emit({"type": "delivery_status", "id": id, "status": "delivered"})
        await asyncio.sleep(0.3)
        await self._emit(
            {"type": "message_received", "id": f"echo-{id}", "from": to,
             "content": f"echo: {content}", "ts": int(time.time() * 1000)}
        )

    async def stop(self) -> None:
        pass
