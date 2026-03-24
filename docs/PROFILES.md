# MC-MONKEYS Runtime Profiles

This project supports three explicit runtime profiles controlled by `NEXT_PUBLIC_RUNTIME_PROFILE`.

## Profile Matrix

| Profile | Primary Use | Data Source | Mutations | /web Pages | License | Onboarding Flow |
|---|---|---|---|---|---|---|
| `local-dev` | Developer sandbox | JSON mock store (`data/mock-state/local-dev.json`) | Enabled | Visible | Bypass / accept-any | Skipped |
| `online-demo` | Public live demo | Seeded DB snapshot via read-only API | Read-only | Visible | Not required | Skipped |
| `install-local` | Customer installed package | Real API + DB | Enabled | Hidden / stripped in ZIP | Required | Enabled |

## Commands

```bash
# Editable local mock, with reset action in UI
npm run dev:local-mock

# Public demo behavior (read-only)
npm run dev:online-demo

# Install-like local behavior (real API + onboarding)
npm run dev:install-local
```

## Environment

Canonical selector:

```env
NEXT_PUBLIC_RUNTIME_PROFILE="local-dev"   # local-dev | online-demo | install-local
```

`NEXT_PUBLIC_RUNTIME_PROFILE` is enforced by default.

If you need temporary backward compatibility with old env/host heuristics during migration, enable it explicitly:

```env
NEXT_PUBLIC_ALLOW_LEGACY_PROFILE_FALLBACK="true"
```

Recommended: keep this fallback disabled in normal operation.

### Local Dev License Modes

```env
NEXT_PUBLIC_DEV_LICENSE_MODE="bypass"      # bypass | accept-any | strict
```

- `bypass`: no license modal in local development
- `accept-any`: modal shown, any non-empty key accepted
- `strict`: full validation flow

## Local Dev Mock Persistence

- File location: `data/mock-state/local-dev.json`
- File is ignored by git
- Initial state: rich seeded dataset
- Reset: use **Reset mock data** in the Mission Control settings menu

## Packaging Guarantee (install-local)

The distribution build (`npm run dist:build`) strips compiled `/web` pages from the package and sets app-only env defaults.

## Quick Verification

1. `local-dev`: create/edit/archive tasks, update subtasks, add comments, refresh/restart and confirm state persists.
2. `online-demo`: same actions should be blocked as read-only.
3. `install-local`: `/web/*` should not be accessible and initialization should run for first-time setup.
