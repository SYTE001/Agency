# Testing Strategy

## Risk-based approach

Tests prioritize the highest-risk boundaries in this repository:

- `lib/domain.vtest.ts` covers deterministic money calculations and RBAC decisions.
- Existing `node:test` suites cover finance formulas, database isolation, and critical service behavior.
- Playwright smoke tests verify that the public entry point is usable and that available command UI dismisses correctly with `Escape`.

The requested cart, checkout, product-service, and order-confirmation scenarios are not implemented in this repository. This is a multi-tenant TikTok agency operations system with Prisma-backed server actions, so those scenarios are intentionally not fabricated. They should be added only when the corresponding product domain exists.

## Local commands

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm test
npm run test:e2e
npm run build
```

Playwright starts a local development server automatically. Authenticated flows require a seeded local database and should be added as fixtures when the authentication contract is available to the test runner.

## CI principles

Pull requests must pass formatting, linting, typechecking, unit tests, and production build. E2E is kept as a separate job because it needs a browser installation and a running application.
