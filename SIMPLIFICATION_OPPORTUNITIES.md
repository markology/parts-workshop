# Simplification Opportunities for Journal Editor

## Current State Analysis

### What's Working Well
✅ Decorator nodes for labels (read-only, non-selectable)
✅ Group-based deletion concept
✅ Basic structure is sound

### What's Still Complex

1. **Deletion Plugin (1100+ lines)**
   - Complex cursor positioning logic (forward vs backward)
   - Empty paragraph cleanup with many edge cases
   - Manual text deletion from nodes
   - Sibling tracking before deletion
   - Multiple fallback strategies for cursor placement

2. **Selection Detection**
   - Checking if labels are "touched" by selection
   - Edge cases for empty paragraphs
   - Handling collapsed vs range selections

3. **Cursor Positioning**
   - Custom logic fighting Lexical's defaults
   - Forward vs backward deletion handling
   - Multiple fallback strategies

## Simplification Strategies

### Strategy 1: Let Lexical Handle More

**Principle**: Only intercept when absolutely necessary, let Lexical do the rest.

**Current Approach**:
- We manually delete text from nodes
- We manually position cursors
- We manually clean up empty paragraphs

**Simplified Approach**:
- Only intercept when decorator is touched → delete group
- Let Lexical handle normal text deletion
- Let Lexical handle cursor positioning
- Only fix cursor position if it's clearly wrong

**Benefits**:
- Less code (~200 lines vs 1100+)
- Fewer edge cases
- More predictable behavior
- Easier to debug

### Strategy 2: Simplify Selection Detection

**Current**: Complex logic checking anchor/focus, offsets, empty paragraphs, etc.

**Simplified**: 
```typescript
// Simple rule: if selection includes decorator → delete group
function isDecoratorTouched(selection: RangeSelection): boolean {
  const nodes = selection.getNodes();
  return nodes.some(node => $isSpeakerLabelDecorator(node));
}
```

**Benefits**:
- Clear, testable logic
- No edge cases for empty paragraphs
- Decorator nodes are non-selectable, so if they're in selection, it's intentional

### Strategy 3: Minimal Cursor Fixing

**Current**: Complex logic to position cursor after deletion

**Simplified**:
- Let Lexical position cursor naturally
- Only fix if cursor is clearly wrong (e.g., in deleted node)
- Use simple fallback: previous sibling → next sibling → new paragraph

**Benefits**:
- Less code
- More predictable
- Lexical's defaults are usually correct

### Strategy 4: Remove Empty Paragraph Cleanup

**Current**: Complex logic to clean up empty paragraphs

**Simplified**: 
- Let Lexical handle empty paragraphs
- Only remove if they're clearly orphaned (no content, not where cursor should be)

**Benefits**:
- Less code
- Fewer edge cases
- Lexical handles this well

## Proposed Simplified Deletion Logic

```typescript
function handleDelete(event: KeyboardEvent | null): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return false;

  // Rule 1: If decorator is touched → delete entire group
  const nodes = selection.getNodes();
  const touchedDecorators = nodes.filter($isSpeakerLabelDecorator);
  
  if (touchedDecorators.length > 0) {
    // Find all groups to delete
    const groupIds = new Set<string | null>();
    for (const decorator of touchedDecorators) {
      const parent = decorator.getParent();
      if ($isSpeakerLineNode(parent)) {
        groupIds.add(parent.getGroupId());
      }
    }
    
    // Delete all groups
    editor.update(() => {
      const root = $getRoot();
      for (const groupId of groupIds) {
        const groupNodes = findNodesByGroupId(root, groupId);
        for (const node of groupNodes) {
          if (node.isAttached()) node.remove();
        }
      }
      
      // Simple cursor fix: find first remaining node or create paragraph
      const rootChildren = root.getChildren();
      if (rootChildren.length === 0) {
        const newPara = $createParagraphNode();
        root.append(newPara);
        // Set cursor in new paragraph
      } else {
        // Set cursor in first remaining node
      }
    });
    
    return true; // Handled
  }
  
  // Rule 2: Normal deletion (let Lexical handle it)
  return false; // Let Lexical handle
}
```

**Estimated Size**: ~100-150 lines vs 1100+ lines

## Additional Simplifications

### 1. Remove Format Lock Plugin?
Since decorator nodes can't be formatted, we might not need the format lock plugin for labels. However, we might still want to prevent formatting in speaker line content.

**Question**: Should speaker line content be formattable? If yes, keep plugin. If no, we can prevent formatting for entire speaker lines.

### 2. Simplify Enter Plugin
Current Enter plugin is relatively simple, but we could make it even simpler by:
- Always creating decorator + content text node
- Let Lexical handle cursor positioning

### 3. Remove Placeholder Character
Currently using `\uFEFF` (zero-width non-breaking space) as placeholder. With decorator nodes, we might not need this.

**Test**: Can we create empty content text node without placeholder?

### 4. Unified Helper Functions
Create a single utility file with simple, testable functions:
- `isDecoratorTouched(selection)` - check if selection includes decorator
- `findGroupNodes(root, groupId)` - find all nodes in group
- `deleteGroup(root, groupId)` - delete entire group
- `findSafeCursorPosition(root)` - find where cursor should go

## Questions to Answer

1. **Should speaker line content be formattable?**
   - If yes: Keep format lock plugin, but simplify it
   - If no: Prevent formatting for entire speaker lines

2. **How should we handle empty paragraphs?**
   - Option A: Let Lexical handle (simplest)
   - Option B: Remove only clearly orphaned ones (middle ground)
   - Option C: Aggressive cleanup (current approach)

3. **Should we remove the placeholder character?**
   - Test if empty text nodes work without placeholder
   - If yes, remove it and simplify cursor positioning

4. **How much cursor fixing do we need?**
   - Option A: Let Lexical handle everything (simplest)
   - Option B: Fix only clearly wrong positions (middle ground)
   - Option C: Custom positioning for all cases (current approach)

## Recommended Next Steps

1. **Test decorator node behavior** - Verify it works as expected
2. **Simplify deletion plugin** - Implement simplified version (~150 lines)
3. **Test edge cases** - See what breaks, fix only critical issues
4. **Iterate** - Add back complexity only if absolutely necessary

## Expected Outcome

- **Code reduction**: 1100+ lines → ~200-300 lines total
- **Fewer bugs**: Simpler logic = fewer edge cases
- **Easier maintenance**: Clear, testable functions
- **Better UX**: More predictable behavior

