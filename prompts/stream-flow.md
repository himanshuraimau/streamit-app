# Streaming App Flow (React Frontend + Node Backend)

A concise reference to implement the end-to-end UI flow in a React app, assuming a Node/Express backend manages LiveKit (ingress/keys, tokens, webhooks) and database (Prisma/Postgres).

## Roles

- Creator: starts stream from OBS using keys; previews stream and uses chat in dashboard.
- Viewer: opens the creator’s page to watch and chat.

## React routes (suggested)

- `/dashboard/keys`  – Shows generated `serverUrl` + `streamKey` from Node.
- `/dashboard/stream` – Preview page: video player + chat + stream info.
- `/u/:username`      – Public watch page (same player layout without creator-only controls).

## Backend endpoints used by the UI

- POST `/api/stream/ingress`         – Create/reset ingress; returns `{ serverUrl, streamKey, ingressId }`.
- GET  `/api/stream/:hostId`         – Get stream + user info.
- GET  `/api/stream/token/:hostId`   – Get LiveKit viewer token `{ token }`.
- POST `/api/webhook/livekit`        – LiveKit webhook (server-to-server), flips `isLive` (not called by UI).

Notes:
- `hostId` is the creator’s `user.id` and the LiveKit room name/host identity.
- Ingress creation and key storage happen only on the Node server.

## Minimal data contract expected by the UI

- `User`: `{ id: string, username: string, imageUrl: string, bio?: string, _count?: { followedBy: number } }`
- `Stream`: `{ title: string, thumbnail?: string | null, isLive: boolean, isChatEnabled: boolean, isChatDelayed: boolean, isChatFollowersOnly: boolean }`

## Environment

- `REACT_APP_API_URL` or configured base URL for API calls.
- `REACT_APP_LIVEKIT_WS_URL` (or `NEXT_PUBLIC_LIVEKIT_WS_URL` in Next) – browser ws URL for LiveKit.

## Creator flow (step-by-step)

1. Keys page loads → UI calls Node to fetch current keys or to create/reset ingress.
   - UI: POST `/api/stream/ingress` (with ingress type if needed: RTMP/WHIP).
   - Response is stored and displayed: `serverUrl`, `streamKey`.
2. Creator sets OBS:
   - Service: Custom
   - Server: `serverUrl`
   - Stream key: `streamKey`
   - Start Streaming.
3. LiveKit webhook (server-only) sets `isLive=true` for this `ingressId`/`userId`.
4. Creator opens `/dashboard/stream` → UI fetches:
   - `GET /api/stream/:hostId` for stream + user data.
   - `GET /api/stream/token/:hostId` for viewer token.
5. `LiveKitRoom` connects using token + ws URL. `Video` component shows Loading → Live when host tracks appear.
6. Chat is enabled if `isChatEnabled` and shows messages via LiveKit data channel.

## Viewer flow (public page)

1. Viewer opens `/u/:username`.
2. UI resolves the creator `hostId` (e.g., by fetching profile), then:
   - `GET /api/stream/:hostId` → metadata + `isLive`.
   - `GET /api/stream/token/:hostId` → token.
3. Join `LiveKitRoom`; show `Offline` if connected but host not publishing.
4. Render chat if allowed (followers-only, delayed flags are respected client-side).

## Component layout (reference)

- `StreamPlayer` (page shell)
  - Fetches token and wraps content in `LiveKitRoom` with `serverUrl`.
  - Two-column grid: main (video + meta) and sidebar (chat).
- `Video`
  - Uses `useRemoteParticipant(hostId)` and `useTracks([Camera, Microphone])`.
  - Renders Offline/Loading/Live based on connection + tracks.
- `Chat`
  - Uses `useChat()` from LiveKit components.
  - Sends/receives via data channel; applies `isChatEnabled`, `isChatDelayed`, `isChatFollowersOnly`.

## Minimal UI calls (pseudo-code)

```tsx
// In a Stream page component
const hostId = user.id; // creator id

useEffect(() => {
  async function bootstrap() {
    const [metaRes, tokenRes] = await Promise.all([
      fetch(`${API}/api/stream/${hostId}`),
      fetch(`${API}/api/stream/token/${hostId}`),
    ]);
    setStream(await metaRes.json());
    setToken((await tokenRes.json()).token);
  }
  bootstrap();
}, [hostId]);

return (
  token ? (
    <LiveKitRoom token={token} serverUrl={LIVEKIT_WS_URL}>
      <Video hostIdentity={hostId} hostName={username} />
      <Chat isChatEnabled={stream.isChatEnabled} /* ... */ />
    </LiveKitRoom>
  ) : <Loading />
);
```

## Error/edge handling (brief)

- If token fetch fails: show retry + basic error.
- If `isLive=false`: still join room; show `Offline` until host appears.
- If chat disabled: hide input and show message list as read-only.
- Handle mobile: auto-collapse chat; provide toggle on large screens.

## What stays on Node (server-only)

- LiveKit ingress creation/deletion and stream key management.
- Viewer token minting with `AccessToken` and room grants.
- Webhook verification and `isLive` updates.
- Persisting `serverUrl`, `streamKey`, `ingressId`, stream flags in DB.

This is intentionally minimal but complete enough for an AI or engineer to wire the React UI to a Node backend that owns keys/tokens/webhooks.




# Stream Frontend Guide (Creator Dashboard)

This doc explains the simple, creator-focused flow for the streaming page UI. It’s designed so an AI can rebuild the same in a React app with a Node.js backend.

## High-level flow

1. Creator generates stream keys in the dashboard (server saves `serverUrl` + `streamKey`).
2. Creator configures OBS with the generated `serverUrl` and `streamKey` and starts streaming.
3. LiveKit ingress starts; a webhook flips `isLive=true` for the stream.
4. Creator opens the Stream page (in the dashboard) to preview video and use chat.

## Pages and placement

- Creator dashboard section hosts all streaming controls and preview.
- A "Keys" page shows the LiveKit ingress server URL and stream key (used by OBS).
- A "Stream" page shows the live preview, stream info, and chat.

## Environment

- `NEXT_PUBLIC_LIVEKIT_WS_URL`: LiveKit WebSocket URL used by the browser to join the room.

## Data contract (minimal)

- User (creator):
  - `id: string` (also the LiveKit room name)
  - `username: string`
  - `imageUrl: string`
  - `bio?: string`
  - `_count.followedBy: number`
  - `stream?: Stream`
- Stream:
  - `title: string`
  - `thumbnail?: string | null`
  - `isLive: boolean`
  - `isChatEnabled: boolean`
  - `isChatDelayed: boolean`
  - `isChatFollowersOnly: boolean`

## Token flow (viewer/creator)

- Frontend asks backend for a LiveKit JWT to join the creator’s room (room = creator `id`).
- Creator preview uses the same viewer token (no publish), because actual media comes from OBS via ingress.
- Minimal token grant used by the UI:
  - `roomJoin: true`
  - `canPublish: false`
  - `canPublishData: true` (for chat)

## Main UI composition

- `LiveKitRoom` (provider) wraps the whole page with the token and ws URL.
- Left/main column (video + meta):
  - `Video`: decides between Offline, Loading, or Live states based on room connection and host tracks.
  - `Header`: title, follow state, basic actions.
  - `InfoCard`: stream thumbnail/name, quick actions.
  - `AboutCard`: creator bio and follower count.
- Right column (chat sidebar):
  - `Chat`: list + input, switches to a "Community" tab for members if needed.
  - Collapsible on large screens; auto-expands on small screens.

### Minimal props contract for a StreamPlayer-like component

- `user`: `{ id, username, bio?, imageUrl, _count: { followedBy }, stream? }`
- `stream`: `{ title, thumbnail?, isLive, isChatEnabled, isChatDelayed, isChatFollowersOnly }`
- `isFollowing: boolean`

## Component responsibilities

- `StreamPlayer` (page shell):
  - Fetches viewer token for `user.id`.
  - Sets up `LiveKitRoom` with the token and `NEXT_PUBLIC_LIVEKIT_WS_URL`.
  - Arranges a responsive grid: main content + chat sidebar with collapse.
- `Video`:
  - Uses `useRemoteParticipant(user.id)` and `useTracks()`.
  - Renders:
    - Offline state when connected but no host participant.
    - Loading while connecting or waiting for tracks.
    - Live when host camera/mic tracks are present.
- `Chat`:
  - Uses `useChat()` for data channel messages.
  - Respects flags: `isChatEnabled`, `isChatDelayed`, `isChatFollowersOnly`.
  - Sends messages via LiveKit data channel (no own backend socket).

## Creator experience (end-to-end)

1. Open Keys page → copy `serverUrl` + `streamKey`.
2. Configure OBS (service = custom, URL = `serverUrl`, key = `streamKey`).
3. Start stream in OBS.
4. Webhook marks stream as live.
5. Open Stream page (dashboard) → see preview (Live state) and chat.

## Minimal backend endpoints used by the UI

- `GET /api/stream/:hostId` → returns `user` + `stream` data for rendering.
- `GET /api/stream/token/:hostId` → returns viewer token `{ token: string }`.

## Notes and guardrails

- The preview page doesn’t publish media; video comes from OBS via LiveKit ingress.
- Use `user.id` consistently as the LiveKit room name and host identity.
- Keep the chat UX tolerant to connection state changes; render gracefully when offline.
- Collapse chat on small screens; show a floating toggle on large screens when collapsed.
