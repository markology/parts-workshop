# AI Instructions Optimization

This system optimizes the loading of AI instructions by caching the markdown file content, significantly reducing costs and improving performance.

## How It Works

1. **Cached Loading**: The markdown file (`src/ai/prompts/ifs_guide.v0.md`) is read once and cached in memory
2. **Smart Re-loading**: Only re-reads the file if it has been modified since last load
3. **Persistent Across Sessions**: Instructions persist for all users until the file is modified
4. **Fallback Protection**: If the file can't be read, falls back to basic instructions

## Files Created

- `src/lib/instructionsLoader.ts` - Main caching logic
- `src/pages/api/admin/clear-instructions-cache.ts` - Admin endpoint to clear cache
- `src/pages/api/dev/test-instructions.ts` - Development testing endpoint

## Usage

### Normal Operation
The system works automatically. Just update your markdown file and the instructions will be loaded on the next request.

### Development
When you update the markdown file during development:

1. **Clear the cache** (optional - will auto-reload on next request):
   ```bash
   curl -X POST http://localhost:3000/api/admin/clear-instructions-cache
   ```

2. **Test instructions loading**:
   ```bash
   curl http://localhost:3000/api/dev/test-instructions
   ```

## Benefits

- **Cost Reduction**: No need to send full instructions with every request
- **Performance**: Faster response times due to cached content
- **Consistency**: All users get the same instructions
- **Maintainability**: Easy to update instructions by editing the markdown file

## File Structure

```
src/
├── ai/prompts/
│   └── ifs_guide.v0.md          # Your instructions (edit this)
├── lib/
│   ├── instructionsLoader.ts     # Caching logic
│   └── aiSession.ts             # Updated to use cached instructions
└── pages/api/
    ├── admin/
    │   └── clear-instructions-cache.ts
    └── dev/
        └── test-instructions.ts
```
