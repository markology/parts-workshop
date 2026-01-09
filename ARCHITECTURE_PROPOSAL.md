# Journal Editor Architecture Proposal

## Current Problems

1. **Complex Deletion Logic**: 1100+ lines handling edge cases, cursor positioning, empty paragraphs
2. **Fighting Lexical**: Custom cursor positioning fights against Lexical's defaults
3. **Fragile Selection**: Empty paragraphs, `<br>` tags cause unpredictable behavior
4. **Formatting Prevention**: Split across multiple plugins and toolbar
5. **Hard to Debug**: Many edge cases, complex state management

## Proposed Architecture

### Core Principle: **Work WITH Lexical, Not Against It**

### 1. Speaker Label as Decorator Node

**Current**: Label is a bold text node inside SpeakerLineNode
**Proposed**: Label is a DecoratorNode (read-only, non-selectable)

**Benefits**:
- Can't be formatted (built into decorator nodes)
- Can't be selected (decorator nodes are non-selectable)
- Simpler deletion logic (if decorator touched → delete group)
- Lexical handles cursor positioning naturally

**Structure**:
```
SpeakerLineNode (ElementNode)
  ├── SpeakerLabelDecorator (DecoratorNode) - read-only, non-selectable
  └── Content (regular TextNodes) - can be formatted normally
```

### 2. Simplified Deletion Logic

**Current**: Complex logic with cursor positioning, empty paragraph cleanup, etc.
**Proposed**: Simple rule-based deletion

**Rules**:
1. If selection touches decorator → delete entire group
2. If selection is in speaker content → delete selected text (normal deletion)
3. If selection spans multiple groups → delete all touched groups + selected text
4. Let Lexical handle cursor positioning (only fix specific edge cases)

**Benefits**:
- Much simpler code (~200 lines vs 1100+)
- Easier to reason about
- Fewer edge cases
- Lexical handles most cursor positioning

### 3. Regular Paragraphs for Content

**Current**: Custom SpeakerLineNode with special behavior
**Proposed**: Keep SpeakerLineNode but simplify it

**Structure**:
- SpeakerLineNode is just a container with attributes
- Content is regular text nodes (can be formatted)
- Label is decorator (can't be touched)

**Benefits**:
- Formatting works normally on content
- Deletion works normally on content
- Only special case: label deletion triggers group deletion

### 4. Plugin Architecture

**Current**: Multiple plugins with overlapping concerns
**Proposed**: Single-responsibility plugins

**Plugins**:
1. **SpeakerLinePlugin**: Handles Enter key, creates new speaker lines
2. **SpeakerLineDeletePlugin**: Simple deletion rules (200 lines max)
3. **SpeakerLineFormatLockPlugin**: Prevents formatting in speaker lines (already exists)
4. **SpeakerLinePastePlugin**: Prevents pasting in speaker lines (merge with format lock)

**Benefits**:
- Clear separation of concerns
- Easy to test
- Easy to debug
- Easy to modify

### 5. Helper Functions

Create a shared utility file with simple, testable functions:

```typescript
// speakerLineUtils.ts
export function isInSpeakerLine(node: LexicalNode): boolean
export function getSpeakerLineGroup(node: LexicalNode): string | null
export function findSpeakerLineGroup(root: LexicalNode, groupId: string): SpeakerLineNode[]
export function isLabelNode(node: LexicalNode): boolean
```

**Benefits**:
- Reusable across plugins
- Easy to test
- Single source of truth

## Implementation Plan

### Phase 1: Create Decorator Node for Labels
- Create `SpeakerLabelDecorator` node
- Make it read-only and non-selectable
- Update ToolbarPlugin to use decorator instead of bold text

### Phase 2: Simplify Deletion Plugin
- Rewrite deletion logic with simple rules
- Remove complex cursor positioning
- Let Lexical handle most cases

### Phase 3: Clean Up Plugins
- Merge format lock and paste prevention
- Simplify Enter plugin
- Remove empty paragraph handling (let Lexical handle it)

### Phase 4: Testing & Refinement
- Test all edge cases
- Refine as needed
- Document behavior

## Expected Outcomes

1. **Code Reduction**: ~1100 lines → ~400 lines
2. **Fewer Bugs**: Simpler logic = fewer edge cases
3. **Easier Maintenance**: Clear separation of concerns
4. **Better UX**: More predictable behavior
5. **Easier Debugging**: Simple, testable functions

## Migration Strategy

1. Create new decorator node alongside existing code
2. Gradually migrate features
3. Test thoroughly before removing old code
4. Keep old code commented for reference

## Questions to Consider

1. Do we need the label to be completely non-selectable, or just non-formattable?
2. Should we keep group deletion, or simplify to single-line deletion?
3. Do we need empty paragraph handling, or can we let Lexical handle it?
4. Should we use decorator nodes or a simpler approach?

