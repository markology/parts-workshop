# Unused files report (auto + manual verification)

This repo was scanned using [`knip`](https://github.com/webpro-nl/knip) and then manually verified via search for imports/usages and Next.js “entrypoint-by-convention” rules.

Command used:

```bash
npx -y knip --reporter json
```

> Note: `knip` exits non-zero when it finds unused items; that’s expected.

## Confirmed unused (safe to delete)

These have **no imports** elsewhere in the repo and are **not** Next.js convention entrypoints (like `src/app/**/page.tsx`, `layout.tsx`, `src/pages/api/**`).

### Root / general

- `posthog.ts` (server PostHog client; no references)
- `src/components/ThemeDebug.tsx`
- `src/components/ToolTipWrapper.tsx`
- `src/server/applyPatch.ts` (only referenced in a commented-out import)
- `src/utils/captureThumbnail.ts`

### Unused workspace “shell” UI (not wired into App Router)

- `src/app/workspace/WorkspaceClientEntry.tsx`
- `src/app/workspace/WorkspaceShell.tsx`
- `src/app/workspace/WorkspaceLanding.tsx`
- `src/app/workspace/WorkspaceNavigation.tsx`

Rationale: `src/app/workspace/[workspaceId]/page.tsx` renders the workspace directly and `src/app/workspace/layout.tsx` doesn’t import any of these.

### Unused workspace components (only referenced by unused files, or not referenced at all)

- `src/features/workspace/components/DesktopWorkspace.tsx` (only referenced by the unused `WorkspaceShell`)
- `src/features/workspace/components/MobileWorkspace.tsx` (only referenced by the unused `WorkspaceShell`)
- `src/features/workspace/components/ThemeEditor.tsx`
- `src/features/workspace/components/TourOverlay.tsx` (commented out in `CanvasClient.tsx`)
- `src/features/workspace/lib/workspaceBackground.ts`

### Unused 3D-mapping / deprecated PartNode subtree

- `src/features/workspace/components/Part3DMapping/Part3DMappingModal.tsx` (only referenced by `PartNode.deprecated.tsx`)
- `src/features/workspace/components/Nodes/PartNode/PartNode.deprecated.tsx`
- `src/features/workspace/components/Nodes/PartNode/AddCustomBucket.tsx`
- `src/features/workspace/components/Nodes/PartNode/CompactImpressionBucket.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartFears.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartMetadata.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartNeeds.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartRelationships.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartImpressionList/PartImpressionContainer.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartImpressionList/PartImpressionList.tsx`
- `src/features/workspace/components/Nodes/PartNode/PartImpressionList/PartImpressionNode.tsx`

### Unused sidebar files

- `src/features/workspace/components/SideBar/SideBar.tsx` (the active workspace uses `PartInput`, `ImpressionInput`, `PartDetailPanel`, etc. directly)
- `src/features/workspace/components/SideBar/PartDetailPanel.backup.tsx`

### Unused hooks / updaters / types

- `src/features/workspace/state/hooks/useDebouncedGlobalSave.ts`
- `src/features/workspace/state/hooks/useDebouncedJournalSave.ts`
- `src/features/workspace/state/hooks/useJournalEntry.ts`
- `src/features/workspace/state/updaters/resetNodes.ts`
- `src/features/workspace/state/hooks/api/useGlobalJourneyQuery.ts` (exports `useGlobalJournalQuery`)
- `src/features/workspace/state/hooks/api/useNodeJournalQuery.ts`
- `src/features/workspace/state/hooks/api/useSaveJournalMutation.ts`
- `src/features/workspace/types/api/map.ts` (only referenced from unused `DesktopWorkspace`/`MobileWorkspace`)

## “Unused in code” but might still be intentionally kept

These aren’t “runtime imports”, but may still be valuable:

- `src/app/lexical-test/` (empty directory; safe to remove if not planned)
- Markdown docs like `src/features/workspace/constants/THEME_GUIDE.md`, `src/lib/INSTRUCTIONS_OPTIMIZATION.md`, etc.

## Next step (optional)

If you want, I can:

- Delete the **confirmed unused** files above (in one PR-sized change).
- Add a small `knip` config + `package.json` script so you can re-run this quickly in the future.


