# Contributing

## Local setup

1. Install Node.js 20.19.0 or use `.nvmrc` / `.node-version`.
2. Run `npm ci`.
3. Copy `.env.example` to `.env` when environment values are needed.
4. Run `npx prisma migrate deploy` for local SQLite.
5. Start the app with `npm run dev`.

## Branching

Use short branches from the default branch:

- `feat/<short-description>` for features
- `fix/<short-description>` for bug fixes
- `docs/<short-description>` for documentation
- `chore/<short-description>` for maintenance

## Commits

Use Conventional Commits, for example `feat: add campaign progress filter` or `fix: scope settlement query by agency`.

Before opening a pull request, run `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, and `npm run build`.
