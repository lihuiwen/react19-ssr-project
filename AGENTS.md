# Repository Guidelines

## Project Structure & Module Organization
The SSR runtime lives in `src/runtime` (`client`, `server`, and `shared` entry points). Build orchestration utilities are in `src/build`, while CLI commands such as `dev`, `build`, and `start` reside in `src/cli`. Compiled artifacts land in `dist/`; keep commits limited to source files and configuration. Example applications sit in `examples/` and reference documentation is under `docs/`. Shared TypeScript declarations belong in `types/`.

## Build, Test, and Development Commands
`pnpm dev` runs `tsx src/cli/dev.ts`, compiling client and server bundles in watch mode. `pnpm build` executes `tsx src/cli/build.ts` to produce production assets in `dist/`. `pnpm start` boots the built server via `node dist/server/server.js`. Use `pnpm type-check` (or `pnpm type-check:watch`) to enforce TypeScript correctness before submitting changes.

## Coding Style & Naming Conventions
Write TypeScript with ES module syntax and default to two-space indentation, matching existing files. Favor descriptive camelCase for variables and functions, PascalCase for components and classes, and kebab-case for file names that represent CLI utilities. Run Prettier and ESLint (installed locally) before pushing; configure your editor to format on save and respect the root `.editorconfig` defaults if present.

## Testing Guidelines
Formal automated testing is still being integrated. For now, rely on `pnpm type-check`, manual verification against the samples in `examples/`, and runtime smoke tests using the development server. When adding tests, colocate them beside the feature entry point (e.g., `src/runtime/server/__tests__`) and name files `*.test.ts`. Coordinate with maintainers before introducing new tooling so we can standardize on a single runner.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat: ...`, `fix: ...`, `chore: ...`) as seen in the repository history. Each pull request should include a concise summary of the change, any breaking implications, verification steps (commands run, screenshots for UI-facing routes), and linked issue references where applicable. Keep PRs focused; if a change across layers is unavoidable, describe the dependency chain clearly to speed up review.

## Configuration & Environment
Environment variables are documented in `.env.example`; copy it to `.env` for local overrides. Avoid committing `.env` files or other secrets. When adding new configuration keys, update both the template and relevant documentation in `docs/` so downstream apps stay in sync.
