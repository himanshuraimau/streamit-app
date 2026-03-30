# Pending Workflow Checklist

Review date: 2026-03-30

Scope: compared [workflow-general.md](/home/himanshu/code/streamitapp/streamit/docs/workflow-general.md) against `frontend/src`, `backend/src`, and `backend/prisma`.

Assumption: items listed here are not fully complete yet, are only partially wired, or currently behave differently enough that they do not fully satisfy the workflow doc.

## Homepage And Discovery

## Trending Content Interactions

- [ ] Surface follow actions directly inside the trending content experience.
- [ ] Wire like/comment/follow behavior inside the shorts experience. The current shorts UI is mostly display-only.
- [ ] Track share counts from the regular post cards. The share UI exists, but regular post cards do not call the backend share-tracking endpoint.

## Become A Creator

- [ ] Add a `Become a Creator` entry inside profile/settings if the workflow doc is still the source of truth. The app currently exposes creator application entry points from navbar/creator pages instead.
- [ ] Build the admin or automated review workflow that changes creator applications from `PENDING` to `APPROVED` or `REJECTED`.
- [ ] Send actual approval or rejection notifications when review decisions are made.
- [ ] Enforce the 30-day re-apply cooldown after rejection.
- [ ] Surface rejection reason clearly in the re-apply UX.

## Dual Dashboards And Creator Ops

- [ ] Add creator earnings and withdrawal workflow.
- [ ] Add creator KYC management after approval.
- [ ] Expand creator analytics beyond the current lightweight stats.
- [ ] Implement community management features. The current community page is marked as coming soon.
- [ ] Implement chat moderation dashboard features. The current creator chat page is marked as coming soon.
- [ ] Add follower/subscriber management tools.

## Creator Go Live Setup

- [ ] Add category, thumbnail, tags, audience, and monetization fields to the go-live setup flow.
- [ ] Add front/back camera switching, audio-only mode, and filters/music options.
- [ ] Add premium stream or pay-per-view setup and limited-seat controls if required by the workflow.

## Creator Live Screen

- [ ] Show live timer, likes, and earnings counters in the creator live header/top bar.
- [ ] Add overlays for top gifter and new follower during the live stream.
- [ ] Add controls for chat toggle, viewer list, gift transactions, pin message, moderation tools, audio-only, filters, and camera switching.
- [ ] Replace the placeholder creator post-stream summary with actual backend stats and earnings.

## Viewer Live Screen

- [ ] Show actual viewer count in the viewer live top bar.
- [ ] Wire live-screen follow behavior to the real follow API/state. The watch page currently passes placeholder handlers.
- [ ] Add live join/gift/top-fan notifications end to end. The popup/data-channel scaffolding exists, but no publisher currently sends those events.
- [ ] Trigger the post-stream summary reliably when a stream ends. The viewer summary depends on a stream-ended data-channel event that is not currently sent.
- [ ] Implement a real recommended-streams algorithm instead of returning all live streams.
- [ ] Fix recommended-stream navigation after stream end so it opens the actual live route.
- [ ] Add mute-user controls alongside block/report in live chat/privacy tools.

## Highlight Feature

- [ ] Build the 10-second highlight workflow: capture last 10 seconds, exclude UI overlays, enforce max 5 highlights per stream, save/share/discard, watermark, default caption, and local-only storage.

## Privacy And Protection

- [ ] Implement native/platform screen-capture protection for Android/iOS and casting/AirPlay blocking. The current web code only provides best-effort warning heuristics.

## Monetization And Sponsored Features

- [ ] Add subscriptions or subscriber-only experiences that match the workflow's `Subscribed` content references.
- [ ] Add pay-per-view or premium streams.
- [ ] Add ads monetization workflow.
- [ ] Add brand deals or sponsored content workflow.
- [ ] Centralize and configure platform commission across monetization channels instead of only hardcoding part of the gift logic.
- [ ] Align coin package offerings with the workflow doc if the required packages are `₹299` and `₹999`.

## Wiring Issues Found During Review

- [ ] Fix the navbar `Buy Coins` menu route. It navigates to `/coins/purchase`, but the app route is `/coins/shop`.
