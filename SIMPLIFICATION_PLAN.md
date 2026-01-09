# Simplification Plan for ToolbarPlugin.tsx

## Goal
Simplify the `handleSpeakerClick` function by extracting duplicated code into helper functions, while keeping all cases and leaving FEFF for now.

## Helper Functions to Add

### 1. `createSpeakerLineWithLabel`
- Creates a speaker line node with label decorator
- Used in: Case 1b, Case 3a, Case 3b, Fallback

### 2. `positionCursorAtEnd`
- Positions cursor at end of speaker line or paragraph
- Used in: Case 1a, Case 1b, Case 3a, Case 3b

### 3. `copyTextNodesWithColor`
- Copies text nodes and applies speaker color
- Used in: Case 1b, Case 3a, Case 3b

### 4. `copyTextNodesWithoutColor`
- Copies text nodes without color (for removing speaker)
- Used in: Case 1a

## Code Reduction

**Before**: ~320 lines in handleSpeakerClick
**After**: ~180 lines (estimated 44% reduction)

## Changes to Make

1. Add helper functions after `getSpeakerColor` (before line 501)
2. Simplify Case 1a (lines 699-752)
3. Simplify Case 1b (lines 754-810)
4. Simplify Case 3a (lines 824-894)
5. Simplify Case 3b (lines 896-962)
6. Simplify Fallback (lines 964-988)

