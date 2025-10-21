streamit-spa
├── public
│   ├── favicon.ico
│   ├── logo_dark.svg
│   ├── logo_light.svg
│   └── index.html
├── src
│   ├── components
│   │   ├── ui (shadcn/ui components, e.g., button, dialog, sidebar)
│   │   ├── stream-player (e.g., index.tsx, actions.tsx, chat.tsx)
│   │   ├── thumbnail.tsx
│   │   ├── user-avatar.tsx
│   │   ├── live-badge.tsx
│   │   ├── verified-mark.tsx
│   │   ├── hint.tsx
│   │   ├── theme-toggle.tsx
│   │   └── theme-provider.tsx
│   ├── layouts
│   │   ├── BrowseLayout.tsx (for public pages like home/search/user profiles)
│   │   └── DashboardLayout.tsx (for /u/:username routes)
│   ├── pages
│   │   ├── home
│   │   │   ├── index.tsx (home feed page)
│   │   │   └── _components
│   │   │       ├── results.tsx
│   │   │       └── result-card.tsx
│   │   ├── search
│   │   │   ├── index.tsx (search page)
│   │   │   └── _components
│   │   │       ├── result.tsx
│   │   │       └── result-card.tsx
│   │   ├── user
│   │   │   ├── index.tsx (user profile/stream page)
│   │   │   └── _components
│   │   │       ├── actions.tsx
│   │   │       └── not-found.tsx
│   │   └── dashboard
│   │       ├── chat
│   │       │   ├── index.tsx (chat settings page)
│   │       │   └── _components
│   │       │       └── chat-settings.tsx
│   │       ├── community
│   │       │   ├── index.tsx (followers/blocks page)
│   │       │   └── _components
│   │       │       ├── data-table.tsx
│   │       │       ├── unblock.tsx
│   │       │       └── block.tsx
│   │       └── keys
│   │           ├── index.tsx (stream keys page)
│   │           └── _components
│   │               ├── url-card.tsx
│   │               ├── key-card.tsx
│   │               └── connect-modal.tsx
│   ├── auth
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── shared
│       ├── navbar
│       │   ├── index.tsx
│       │   ├── logo.tsx
│       │   ├── search.tsx
│       │   └── actions.tsx
│       └── sidebar
│           ├── index.tsx
│           ├── following.tsx
│           ├── recommended.tsx
│           └── user-item.tsx
│   ├── queries (TanStack Query hooks, e.g., useUser.ts, useFeed.ts)
│   │   ├── users.ts
│   │   ├── streams.ts
│   │   └── follows.ts
│   ├── mutations (TanStack Query mutations, e.g., useFollow.ts)
│   │   ├── follows.ts
│   │   └── blocks.ts
│   ├── stores (Zustand stores, e.g., useChatSidebar.ts)
│   ├── hooks (custom hooks, e.g., useViewerToken.ts, useIsMobile.ts)
│   ├── lib
│   │   ├── utils.ts
│   │   ├── api.ts (authed fetch helper)
│   │   ├── uploadthing.ts
│   │   └── db.ts (remove Prisma client, as it's backend-only)
│   ├── App.tsx (main router with Routes/Route)
│   ├── main.tsx (entry point with providers)
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json (for shadcn/ui)
├── vite.config.ts
└── README.md