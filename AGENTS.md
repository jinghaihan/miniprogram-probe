# AGENTS.md

Guidance for agents and contributors working on `miniprogram-probe`.

## Project Intent

`miniprogram-probe` is a small CLI for probing WeChat Mini Program memory on real devices through platform tooling such as Xcode Instruments and ADB.

Keep the tool focused, scriptable, and predictable. Prefer small modules with clear boundaries over broad utility files or hidden side effects.

## Development Commands

- Install dependencies with `pnpm install`.
- Run the CLI locally with `pnpm start`.
- Build with `pnpm build`.
- Check types with `pnpm typecheck`.
- Run linting with `pnpm lint`.
- Run tests with `pnpm test`.

Before handing off a change, run the smallest useful verification command. For behavior changes, prefer `pnpm typecheck`, `pnpm lint`, and the relevant tests.

## Source Layout

- `src/cli.ts` owns CLI wiring, argument parsing, prompts, process exits, and user-facing terminal output.
- `src/index.ts` is the public library entry. Export public APIs from here.
- `src/config.ts` owns config loading, normalization, and option merging.
- `src/constants.ts` contains shared constants only.
- `src/types.ts` contains shared TypeScript types and interfaces only.
- `src/utils.ts` contains shared utility functions only when they are genuinely cross-module.

Do not place constants, types, or generic helpers inside feature modules if they are shared by multiple modules. Move them to the dedicated files above.

## Module Splitting

Start with simple files, then split by intent when a file grows or mixes responsibilities.

When a single concern becomes complex, turn the file into a directory with an `index.ts` export:

```text
src/android/
  index.ts
  adb.ts
  meminfo.ts
  process.ts

src/ios/
  index.ts
  instruments.ts
  process.ts
```

Prefer intent-based modules over technical dumping grounds. Good module names describe the job being done:

- `android`, `ios`, `devices`, `sampling`, `reporting`, `config`

Avoid vague buckets:

- `helpers`, `misc`, `common`, `stuff`

Each module directory should expose its public surface through `index.ts`. Other modules should import from the module root when possible:

```ts
import { readAndroidMemory } from './android'
```

instead of reaching into internals:

```ts
import { readAndroidMemory } from './android/meminfo'
```

## Constants, Types, and Utilities

- Put shared constants in `src/constants.ts`.
- Put shared types in `src/types.ts`.
- Put shared utilities in `src/utils.ts`.
- If any of those files becomes too broad, convert it into a directory:

```text
src/constants/
  index.ts
  android.ts
  ios.ts

src/types/
  index.ts
  config.ts
  devices.ts
  memory.ts

src/utils/
  index.ts
  command.ts
  parsing.ts
  time.ts
```

Keep the same import rule: expose shared exports from `index.ts`.

## Coding Style

- Use TypeScript and ESM imports.
- Keep functions small and named after their intent.
- Prefer explicit return types for exported functions.
- Keep CLI output in `src/cli.ts` or dedicated reporting modules.
- Keep platform command execution isolated behind platform modules.
- Avoid adding dependencies unless they clearly reduce complexity.
- Keep comments rare and useful; explain non-obvious behavior, not syntax.

## Platform Boundaries

Treat iOS and Android probing as separate capabilities.

- Android-specific ADB logic should live under an Android module once it grows beyond trivial code.
- iOS-specific Xcode or Instruments logic should live under an iOS module once it grows beyond trivial code.
- Shared sampling, parsing, reporting, and config code should not depend directly on CLI prompt libraries.

This keeps the CLI usable both interactively and in scripts.

## Testing

- Add focused tests for parsing, config resolution, command construction, and memory sample normalization.
- Avoid tests that require a real device unless they are explicitly marked as integration tests.
- Mock process execution around ADB, Xcode, or Instruments calls.

## Commit Messages

Use Conventional Commits.

Format:

```text
type(scope): summary
```

Examples:

```text
feat(android): add adb meminfo sampler
fix(config): normalize default export configs
docs: add agent contribution guide
test(ios): cover instruments process parsing
chore: update dependencies
```

Common types:

- `feat`
- `fix`
- `docs`
- `refactor`
- `test`
- `chore`
- `build`
- `ci`
- `perf`

Use lowercase scopes such as `android`, `ios`, `cli`, `config`, `sampling`, or `reporting`. Keep the summary short, imperative, and without a trailing period.
