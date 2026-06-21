# Memory Lifecycle

INI Brain v3.1.0 extends the local memory layer with lifecycle controls inspired by AgentMemory, while keeping storage inside the workspace.

## Metadata

Each memory can include:

- `confidence`: a number from 0 to 1 used in retrieval scoring.
- `expiresAt`: optional ISO timestamp for temporary memories.
- `pinned`: protects a memory from deletion during compaction.
- `origin`: short label describing where the memory came from.

Old memory entries remain readable. Missing metadata receives safe defaults when read.

## Compaction

`ini_brain_memory_compact` previews changes by default. It can:

- Remove expired memories only when they are not pinned.
- Merge near duplicates only when the memory kind matches and concepts overlap.
- Preserve pinned memories even when they are old or expired.

Pass `apply=true` only when you want the dry-run preview to be written back to `.brain/memories.json`.

## Stats

`ini_brain_memory_stats` returns local totals, pinned count, expired count, kind counts, average importance, and average confidence.

## Privacy

No external memory server, database, or network service is required. The implementation does not bundle AgentMemory as a runtime dependency.
