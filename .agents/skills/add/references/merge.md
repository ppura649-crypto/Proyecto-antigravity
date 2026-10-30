# What a merge does

Reads `pack.json`:

```json
{ "name": "quick-cuts", "kind": "format", "version": "0.1.0", "runtime": ">=0.1.0", "setup_version": 1, "command": "/quick-cuts",
  "first_run": { "rank": 3, "why": "it needs a folder of clips and a song, or a topic to research" },
  "provides": { "formats": ["quick-cuts"], "skills": [".agents/skills/quick-cuts"], "scripts": ["scripts/*.mjs"], "compositions": ["remotion/*.tsx"], "assets": ["assets/**"], "hooks": [] },
  "needs": { "keys": ["COMPOSIO_API_KEY"], "inputs": ["a folder of clips"], "deps": {} } }
```

Then, in order:

1. Refuse if `runtime` is not satisfied by `runtime.json`'s version, or if a pack with the same name and a newer version is already installed.
2. Copy each skill folder to `.agents/skills/<name>/`.
3. Copy scripts to `scripts/<format>/`, keeping their relative layout.
4. Copy compositions to `remotion/<format>/` and append their paths to `runtime.json.compositions`.
5. Copy assets to `assets/<format>/`.
6. Register hooks by appending to `hooks/registry.json`.
7. Append `{ name, version, setup_version, command, first_run, needs, at }` to `runtime.json.packs` and write `.installed/<format>.json` with the full file list. `first_run` is how a pack says what it needs before it can do anything, and it is what decides the order when several formats are installed and none has started: the lowest rank goes first and its `why` is the sentence the buyer hears. A pack that omits it goes last. Nothing else reads it, and it never overrides a format that is already part way through its stages.
8. Never write under `workspace/`, `context/` or `.env.local`.

Removal reads `.installed/<format>.json`, deletes those files, removes the registry entries, and leaves `workspace/library/<format>.json` in place so a reinstall keeps the setup.

## When the download is a folder, not a pack

What a buyer downloads for a second format is a whole Keyframes folder with that format already merged in. It has no `pack.json` at its root, so the merge reads its `runtime.json` for the formats it carries and its `.installed/<format>.json` for every path each one owns, and copies exactly those. Formats this folder already has at the same version or newer are skipped, and the merge says so rather than doing nothing quietly.

Before any of that, the versions are compared. If the downloaded folder is the newer of the two, the shared part is copied over first: everything in it that is not a format and not the buyer's own, which is to say never `workspace/`, `context/`, `.env.local` or the install records. This is what lets a format sold in December ask for a folder that did not exist in October without the buyer having to know which of the two they are holding.

`VERSION` is written after every change, and lists the runtime and every format installed.
