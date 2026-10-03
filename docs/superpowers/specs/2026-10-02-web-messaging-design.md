# Web messaging app over Offline Protocol: design

## Goal
A browser messaging app that sends and receives over the Offline Protocol mesh. The SDK has no browser build, so a local Python bridge hosts it and the SPA talks to the bridge over WebSocket.

## Repo layout
```
/mobile   existing Expo app (moved here, unchanged)
/web      new React 19 SPA (Rsbuild, MUI, Emotion, Redux Toolkit/RTK Query, react-i18next, MSW, Vitest)
/bridge   Python service wrapping the SDK's ProtocolManager
/docs
```

## Bridge (`bridge/`)
- Python 3.10+, `websockets`, SDK desktop bindings (`offline_protocol_sdk`; built from source, needs Rust and uniffi-bindgen).
- Serves `ws://127.0.0.1:8765`, bound to loopback only, with an Origin allowlist.
- JSON frames, each with a `type`:
  - server to client: `identity {address}`, `message_received {id, from, content, ts}`, `neighbor_discovered {id, transport, rssi?}`, `neighbor_lost {id}`, `delivery_status {id, status: delivered|failed}`, `error {code, message}`
  - client to server: `send_message {id, to, content}`, `get_peers`
- `bridge/manager.py` is the only file that imports the SDK, behind a small `MeshPort` protocol so tests use a fake.

## SPA (`web/`), conventions per front-end-coding-conventions
- Layout: `src/@types`, `store/slices`, `services/api.ts`, `components` (atoms/molecules/organisms with `*.style.ts`), `utils`, `views/Chat`, `public/locales`.
- Strict TypeScript, no `any`, MUI components only (no native tags), all copy via `t()`.
- **Bridge connection:** an RTK Query streaming endpoint (`onCacheEntryAdded`) opens the WebSocket, validates inbound frames at the edge (`unknown` narrowing), and dispatches to slices. It reconnects with backoff.
- **Slices:** `peers`, `conversations` (messages keyed by peer, status `pending|sent|delivered|failed`), `connection` (bridge up/down, own address), `composer` (draft state).
- **Offline-first:** conversations and the outbox persist to `localStorage`. Sending while the bridge is down stores the message as `pending`. On reconnect the outbox flushes in order. Messages are deduplicated by id.
- **UI:** a peer list with transport and RSSI, a message thread with status ticks, a connection banner, and a composer. It follows the system light/dark theme and is responsive.
- **Mocking:** MSW `ws` handlers emulate the bridge, backing `npm run dev` and the tests.

## Testing
- Web: Vitest, RTL and MSW. Covers the send flow, offline queue and flush, receive, delivery status, reconnect, and reducers/selectors.
- Bridge: pytest with a fake `MeshPort`. Covers frame validation, event fan-out and Origin rejection.
- Not verified: the real SDK on a physical mesh. That needs a source build of the bindings and peer devices, so it is documented but not tested here.

## Out of scope
Auth, group chats, calls, attachments, and a service worker or PWA. The bridge is single-user and local.

## Risks
- The SDK Python bindings may differ from the README's API, so the adapter is isolated in `bridge/manager.py`.
- Windows source build of the SDK is heavy; the README will list the steps.
