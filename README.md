# Offline Protocol messaging PoC

| Folder | What it is |
|---|---|
| `mobile/` | Expo / React Native app using `@offline-protocol/mesh-sdk` directly (BLE, WiFi Direct). |
| `web/` | React 19 SPA (Rsbuild, MUI, Redux Toolkit, react-i18next, MSW). |
| `bridge/` | Python WebSocket service that hosts the SDK for the browser. |

The SDK has no browser build, so the web app talks to the bridge over `ws://127.0.0.1:8765`:

```
browser (web/) <-- JSON frames over WebSocket --> bridge/ <-- Python bindings --> Offline Protocol mesh
```

## Run the web app

No hardware needed, using the bridge's loopback mesh (it echoes your messages):

```bash
pip install -r bridge/requirements.txt
python -m bridge --fake          # terminal 1

cd web && npm install
npm run dev                      # terminal 2 -> http://localhost:5173
```

Or run without Python at all, with the bridge emulated in the browser by MSW:

```bash
cd web && npm run dev:mock
```

Scripts in `web/`: `npm test`, `npm run typecheck`, `npm run build`. Bridge tests: `python -m pytest bridge/tests -c bridge/pytest.ini --rootdir=.`.

## Use the real mesh

`python -m bridge` (without `--fake`) uses the SDK's desktop Python bindings through `bridge/manager.py`. They have no prebuilt wheel, so build them from source:

1. Install Rust (<https://rustup.rs>), then `cargo install uniffi --version 0.30.0 --features cli --locked`.
2. Clone <https://github.com/Offline-Protocol/offline-protocol-sdk>, then `cd bindings/python && bash scripts/build-desktop.sh && pip install -e .`.
3. `python -m bridge --user-id <your-id>`.

**Not verified:** the `SdkMesh` adapter has only been exercised through a fake mesh. Its event translation follows the SDK README and may need adjusting against the real bindings and live peers.

## Behaviour worth knowing

- **Offline-first:** messages and peers persist in `localStorage`. Sending while the bridge is down queues the message as pending, and it is sent in order on reconnect.
- **Delivery states:** pending (queued), sent (handed to the bridge), delivered or failed (reported by the mesh). "Sent" has no acknowledgement, so a message handed to a bridge that dies immediately afterwards stays "sent".
- **Security:** the bridge binds to loopback only and rejects WebSocket connections whose Origin is not `http://localhost:5173` or `http://127.0.0.1:5173`.
- **Config:** `PUBLIC_BRIDGE_URL` overrides the WebSocket address.

Design and plan: `docs/superpowers/specs/` and `docs/superpowers/plans/`.
