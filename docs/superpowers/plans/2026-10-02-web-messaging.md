# Web Messaging App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser messaging SPA that sends and receives over the Offline Protocol mesh via a local Python WebSocket bridge.

**Architecture:** `bridge/` (Python) wraps the SDK's `ProtocolManager` behind a `MeshPort` and serves JSON frames over loopback WebSocket. `web/` (React 19 SPA) connects through an RTK Query streaming endpoint, keeps state in slices, and persists conversations and an outbox to `localStorage`.

**Tech Stack:** React 19, TypeScript strict, Rsbuild, MUI, Emotion, Redux Toolkit/RTK Query, react-i18next, MSW v2 (`ws`), Vitest + RTL; Python 3.10+, `websockets`, pytest.

**Spec:** `docs/superpowers/specs/2026-10-02-web-messaging-design.md`

## Global Constraints

- Strict TypeScript, no `any`; function components and hooks only.
- No native HTML tags in JSX; use MUI components and `styled()`.
- No user-facing string literals in JSX; use `t()`.
- Styled-component props live in a separate interface; styling reads theme tokens.
- Layout: `src/@types`, `store/slices`, `services/api.ts`, `components`, `utils`, `views`, `public/locales`.
- Bridge binds `127.0.0.1:8765` only and enforces an Origin allowlist.
- Only `bridge/manager.py` imports the SDK.
- Tests are behavioural; the network is mocked with MSW.
- `mobile/` is not modified.

## Frame protocol (shared by both sides)

- server to client: `identity {address}`, `message_received {id, from, content, ts}`, `neighbor_discovered {id, transport, rssi?}`, `neighbor_lost {id}`, `delivery_status {id, status: "delivered"|"failed"}`, `error {code, message}`
- client to server: `send_message {id, to, content}`, `get_peers`

---

### Task 1: Bridge

**Files:**
- Create: `bridge/protocol.py`, `bridge/manager.py`, `bridge/server.py`, `bridge/__main__.py`, `bridge/requirements.txt`, `bridge/tests/test_server.py`

**Interfaces:**
- Produces: `parse_command(raw: str) -> dict` (raises `ProtocolError`), `class MeshPort(Protocol)` with `async start(on_event)`, `async send(id, to, content)`, `async stop()`; `async handle(ws, mesh, allowed_origins)`; `SdkMesh` adapter in `manager.py`.

- [ ] **Step 1:** Write `bridge/tests/test_server.py` with a `FakeMesh` (records sends, lets the test emit events) covering: rejects a bad Origin; rejects malformed JSON with an `error` frame; `send_message` reaches `FakeMesh.send`; an emitted event is forwarded to the client as the matching frame.
- [ ] **Step 2:** Run `pytest bridge/tests -v`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement `protocol.py` (validation), `server.py` (handler plus `serve()` on 127.0.0.1:8765), `manager.py` (`SdkMesh` using `ProtocolManager`, imported lazily so tests don't need the SDK), and `__main__.py` (`python -m bridge`, with `--fake` to run a loopback mesh for local demos).
- [ ] **Step 4:** Run `pytest bridge/tests -v`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(bridge): websocket bridge over MeshPort`.

### Task 2: Web scaffold

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/rsbuild.config.ts`, `web/vitest.config.ts`, `web/index.html`-equivalent via Rsbuild template, `web/src/index.tsx`, `web/src/App.tsx`, `web/src/i18n.ts`, `web/public/locales/en/common.json`, `web/src/test/setup.ts`

**Interfaces:**
- Produces: `renderWithProviders(ui, { preloadedState })` in `src/test/utils.tsx`; typed hooks `useAppDispatch`, `useAppSelector` in `src/store/hooks.ts`; `makeStore(preloaded?)` in `src/store/index.ts`.

- [ ] **Step 1:** Create the project files and install deps (`npm i react react-dom @mui/material @emotion/react @emotion/styled @reduxjs/toolkit react-redux react-i18next i18next` and dev deps `@rsbuild/core @rsbuild/plugin-react typescript vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw`).
- [ ] **Step 2:** Write a smoke test that renders `<App />` and expects the heading from `t('app.title')`. Run `npm test`; expect FAIL, implement, expect PASS.
- [ ] **Step 3:** Commit `chore(web): scaffold rsbuild react spa`.

### Task 3: Types, slices, persistence

**Files:**
- Create: `web/src/@types/chat.ts`, `web/src/store/slices/{peers,conversations,connection}.ts`, `web/src/utils/persist.ts`, plus `*.test.ts` beside each

**Interfaces:**
- Produces: types `Peer`, `ChatMessage {id, peerId, direction, content, ts, status}`, `MessageStatus = "pending"|"sent"|"delivered"|"failed"`; actions `messageQueued`, `messageReceived` (dedupes by id), `statusUpdated`, `peerFound`, `peerLost`, `connectionChanged`, `identitySet`; selector `selectOutbox`; `loadState()`/`saveState()` over `localStorage` in try/catch.

- [ ] **Step 1:** Write reducer tests (dedupe, status transitions, outbox contains only `pending`, persistence round-trip). Run, expect FAIL.
- [ ] **Step 2:** Implement. Run, expect PASS.
- [ ] **Step 3:** Commit `feat(web): chat state slices and persistence`.

### Task 4: Bridge service (RTK Query streaming)

**Files:**
- Create: `web/src/@types/frames.ts`, `web/src/utils/frames.ts` (`parseFrame(data: unknown): ServerFrame | null`), `web/src/services/api.ts`, `web/src/services/bridge.ts`, `web/src/mocks/{handlers.ts,browser.ts,server.ts}`, tests

**Interfaces:**
- Consumes: slice actions from Task 3.
- Produces: `bridgeApi.endpoints.stream` (streaming `onCacheEntryAdded`, reconnect with backoff, flushes the outbox on open); `sendMessage(to, content)` thunk that queues, then sends the frame if connected.

- [ ] **Step 1:** Write tests using MSW `ws.link('ws://127.0.0.1:8765')`: inbound `message_received` lands in the store; `send_message` while disconnected stays `pending`, then is sent in order after reconnect; `delivery_status` updates the status; malformed frames are ignored.
- [ ] **Step 2:** Run, expect FAIL. Implement. Run, expect PASS.
- [ ] **Step 3:** Commit `feat(web): bridge streaming endpoint and offline outbox`.

### Task 5: UI

**Files:**
- Create under `web/src/`: `theme.ts`, `components/atoms/StatusTick/`, `components/molecules/{MessageBubble,PeerItem,Composer}/`, `components/organisms/{PeerList,MessageThread,ConnectionBanner}/`, `views/Chat/Chat.tsx`, each with a sibling `*.style.ts`, plus locale keys and tests

- [ ] **Step 1:** Write behavioural tests: select a peer, type, send, and see a pending bubble then a delivered tick; the banner shows offline when disconnected; the composer is disabled with no peer selected.
- [ ] **Step 2:** Run, expect FAIL. Implement. Run, expect PASS.
- [ ] **Step 3:** Commit `feat(web): chat ui`.

### Task 6: Docs and verification

**Files:**
- Create: `README.md` (root: layout, run web with MSW, run bridge with `--fake`, real SDK build steps on Windows); `web/README.md` if needed

- [ ] **Step 1:** Write the docs.
- [ ] **Step 2:** Run `npm run lint`, `npx tsc --noEmit`, `npm test` in `web/`, and `pytest bridge/tests`. Start the dev server with the bridge `--fake` and confirm a message round-trips in the browser.
- [ ] **Step 3:** Commit `docs: readme and run instructions`.
