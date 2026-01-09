# Why Empty Paragraphs Are Created

## The Problem

When you select all and delete (including speaker pills), you end up with empty `<p>` tags instead of a clean empty editor. This doesn't happen with normal deletion.

## Root Cause Analysis

### Normal Lexical Deletion Flow:
1. User selects text and presses delete
2. Lexical's built-in deletion handler runs
3. Lexical deletes text nodes AND automatically removes empty paragraph containers
4. Result: Clean deletion, no empty paragraphs left behind

### Our Custom Deletion Flow (SpeakerLineDeletePlugin):
1. User selects text (including speaker decorator) and presses delete
2. **We intercept** the deletion (return `true` at line 405)
3. **We manually delete text nodes** using `node.remove()` (line 340) or `spliceText()` (line 343)
4. **We replace speaker lines with paragraphs** (line 356-359)
5. **We prevent Lexical's default deletion** (line 403: `event.preventDefault()`)
6. **Result: Empty paragraph containers remain** because we bypassed Lexical's cleanup

## Where Empty Paragraphs Come From

### Source 1: Text Node Deletion (Lines 337-345)
```typescript
// When we remove entire text nodes:
node.remove();  // ← This removes the TEXT NODE, but NOT the paragraph container
```

**What happens:**
- Text node inside paragraph: `<p><span>text</span></p>`
- We call `node.remove()` on the span
- Result: `<p></p>` ← Empty paragraph remains!

**Why Lexical doesn't clean it up:**
- We prevented Lexical's default deletion handler from running
- Lexical's cleanup logic only runs in its own deletion handlers
- We're doing manual node removal, so cleanup doesn't happen

### Source 2: Replacement Paragraph (Lines 347-360)
```typescript
// We create a new paragraph to replace the first speaker line:
replacementParagraph = $createParagraphNode();
firstDeletedNode.replace(replacementParagraph);
```

**What happens:**
- If we delete everything, we still create this replacement paragraph
- This paragraph is empty (no text node added)
- Result: Empty `<p></p>` tag

### Source 3: Partial Text Deletion (Line 343)
```typescript
// When we use spliceText to delete part of a text node:
node.spliceText(startOffset, endOffset - startOffset, "", true);
```

**What happens:**
- If we delete all text from a node, it becomes empty
- The text node might be removed, but the paragraph container might remain
- Lexical normally handles this, but we bypassed it

## Why Normal Deletion Works

When you delete normal text (no speaker pills):
1. Our plugin returns `false` (line 221: `return false`)
2. Lexical's default deletion handler runs
3. Lexical handles text deletion AND paragraph cleanup automatically
4. Result: Clean deletion

## The Fix

We need to either:
1. **Let Lexical handle text deletion** - Only intercept for speaker group deletion, let Lexical handle normal text
2. **Manually clean up empty paragraphs** - After our deletion, remove empty paragraph containers
3. **Don't create replacement paragraph if everything is deleted** - Check if editor will be empty before creating replacement

## Recommendation

**Option 1 is cleanest**: Only intercept deletion when we need to delete speaker groups. For normal text deletion, let Lexical handle it. This way Lexical's built-in cleanup runs.

The current code tries to handle everything manually, which is why we're seeing empty paragraphs.

