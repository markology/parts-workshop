# Map Thumbnail Snapshot Implementation

## What's Been Done

Based on the [React Flow download image example](https://reactflow.dev/examples/misc/download-image), I've implemented automatic thumbnail capture for workspace maps.

### Changes Made:

1. **Database Schema** (`prisma/schema.prisma`)
   - Added `thumbnail` field to the `Map` model (String?, nullable)

2. **Thumbnail Capture** (`src/features/workspace/state/hooks/useSaveMap.ts`)
   - Uses `html-to-image` package to capture the React Flow canvas
   - Captures at 800x450 resolution with 0.5 pixel ratio for performance
   - Fire-and-forget: won't block save if thumbnail capture fails

3. **API Update** (`src/pages/api/maps/[id].ts`)
   - Updated to accept and store thumbnail data in database

4. **UI Display** (`src/app/workspace/page.tsx`)
   - Workspace tiles now display thumbnails if available
   - Falls back to placeholder Map icon if no thumbnail

## What You Need To Do

### 1. Install the required package:

```bash
pnpm add html-to-image@1.11.11
```

### 2. Run the database migration:

```bash
npx prisma migrate dev --name add_thumbnail_to_map
```

### 3. Regenerate Prisma client:

```bash
npx prisma generate
```

## How It Works

When a map is saved (every 30 seconds via autosave or on manual save):

1. The system captures a screenshot of the React Flow canvas using `html-to-image`
2. The screenshot is converted to a JPEG base64 string
3. The thumbnail is stored in the database with the map data
4. The workspace list displays these thumbnails on the tiles

## Technical Details

- **Resolution**: 800x450px
- **Format**: JPEG with 0.8 quality
- **Background**: Dark gray (#1f2937) for aesthetic consistency
- **Capture Target**: `.react-flow__pane` DOM element
- **Performance**: 0.5 pixel ratio reduces data size by ~75%

## Fallbacks

- If thumbnail capture fails, the save still succeeds
- If no nodes exist on the map, no thumbnail is captured
- Empty maps show the placeholder icon instead

## Future Enhancements

Consider implementing:
- Manual "Update Thumbnail" button
- Thumbnail cache invalidation on significant map changes
- Progressive loading (show placeholder, then load thumbnail)

