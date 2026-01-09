# ToolbarPlugin Cleanup Summary

## Code to Remove (since FEFF is gone):

### 1. Remove `$getNodeByKey` import (line 49)
**From:**
```typescript
  $getNodeByKey,
} from "lexical";
```
**To:**
```typescript
} from "lexical";
```

### 2. Remove empty placeholder creation (lines 726-730)
**Remove these lines:**
```typescript
            // If paragraph is empty, add a placeholder
            if (paragraph.getTextContent().trim() === "") {
              const placeholder = $createTextNode("");
              paragraph.append(placeholder);
            }
```

### 3. Simplify offset calculation (line 739-741)
**From:**
```typescript
              const offset = textContent.startsWith("\uFEFF")
                ? textContent.length
                : textContent.length;
```
**To:**
```typescript
              const offset = textContent.length;
```

### 4. Remove entire FEFF cleanup block (lines 1157-1274)
**Replace:**
```typescript
      editor.registerUpdateListener(({ editorState, dirtyElements }) => {
        readToolbarState(editorState);

        // Clean up placeholder characters in speaker line content nodes
        // ... (entire cleanup block) ...
      })
```
**With:**
```typescript
      editor.registerUpdateListener(({ editorState }) => {
        readToolbarState(editorState);
      })
```

## Total Lines Removed: ~120 lines

