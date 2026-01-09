# All Cases Covered by Speaker Pill Behavior

## Overview
The `handleSpeakerClick` function in `ToolbarPlugin.tsx` handles speaker pill clicks across different editor contexts. Here are ALL the cases it covers:

---

## CASE 1: User is ALREADY in a Speaker Line

### Case 1a: Clicking the SAME speaker pill (Toggle OFF)
**User Action**: Cursor is inside a speaker line, user clicks the same speaker pill that's already active

**Behavior**:
- ✅ Removes the speaker label (converts speaker line → regular paragraph)
- ✅ Preserves all text content
- ✅ Preserves formatting (bold, italic, underline)
- ✅ Removes speaker color (reverts to default)
- ✅ If paragraph becomes empty, adds FEFF placeholder for cursor positioning
- ✅ Positions cursor at end of line
- ✅ Does NOT call `onToggleSpeaker` (lets it deselect naturally)

**Use Case**: User wants to "un-label" text that was previously attributed to a speaker

---

### Case 1b: Clicking a DIFFERENT speaker pill (Switch Speaker)
**User Action**: Cursor is inside Speaker A's line, user clicks Speaker B's pill

**Behavior**:
- ✅ Changes the speaker label to the new speaker
- ✅ Preserves all text content
- ✅ Applies new speaker's color to text nodes
- ✅ Creates new groupId (new speaker group)
- ✅ FEFF placeholder is commented out (testing if needed)
- ✅ Positions cursor at end of line
- ✅ Calls `onToggleSpeaker` with new speaker ID

**Use Case**: User wants to change who said something (re-attribute text to different speaker)

---

## CASE 2: User is in a List Item

**User Action**: Cursor is inside a list item (bullet or numbered list)

**Behavior**:
- ✅ Early return - does nothing
- ✅ Prevents speaker pills from being applied to list items

**Use Case**: Lists and speakers are mutually exclusive - can't have both

---

## CASE 3: User is in Normal Paragraph (Not in Speaker Line or List)

### Case 3a: User has SELECTED TEXT
**User Action**: User highlights/selects some text in a normal paragraph, then clicks a speaker pill

**Behavior**:
- ✅ Creates new speaker line with speaker label
- ✅ Converts selected text to speaker content
- ✅ Applies speaker color to the selected text
- ✅ Replaces the parent paragraph with speaker line
- ✅ If selection was empty, adds FEFF placeholder
- ✅ Positions cursor at end of line
- ✅ Calls `onToggleSpeaker` with speaker ID

**Use Case**: User wants to attribute existing text to a speaker (like converting to a list item)

**Edge Cases Handled**:
- Selection spans multiple paragraphs → replaces first paragraph, removes others
- Selection includes decorators → skips them
- Selection includes line breaks → preserves them
- Selection is empty → adds FEFF placeholder

---

### Case 3b: User has NO SELECTION (Empty Line or Cursor)
**User Action**: User clicks a speaker pill while cursor is in an empty paragraph or at end of paragraph with content

**Sub-case 3b-i: Empty Line**
- ✅ Creates speaker line with label
- ✅ Adds FEFF placeholder for cursor positioning
- ✅ Positions cursor at end (after FEFF)
- ✅ Applies speaker color

**Sub-case 3b-ii: Line Has Content**
- ✅ Creates speaker line with label
- ✅ Copies existing paragraph content
- ✅ Applies speaker color to all text nodes
- ✅ Preserves non-text nodes (line breaks, etc.)
- ✅ Positions cursor at end of line

**Use Case**: User wants to start typing as a speaker, or convert existing paragraph text to speaker text

---

## CASE 4: Fallback (Edge Case)
**User Action**: None of the above cases apply (rare edge case)

**Behavior**:
- ✅ Creates new speaker line at end of editor
- ✅ Adds label + FEFF placeholder
- ✅ Positions cursor at offset 1 (after FEFF)
- ✅ Applies speaker color

**Use Case**: Safety net for unexpected editor states

---

## Summary Table

| Context | Selection | Speaker | Behavior |
|---------|-----------|---------|----------|
| In Speaker Line | Any | Same | Remove label (convert to paragraph) |
| In Speaker Line | Any | Different | Switch to new speaker |
| In List Item | Any | Any | Prevent (do nothing) |
| Normal Paragraph | Has Selection | Any | Convert selection to speaker line |
| Normal Paragraph | No Selection (Empty) | Any | Add label to empty line |
| Normal Paragraph | No Selection (Has Content) | Any | Add label to line with content |
| Edge Case | Unknown | Any | Create new speaker line at end |

---

## Key Behaviors Across All Cases

1. **Cursor Positioning**: Always positions cursor at end of line (except fallback uses offset 1)
2. **Color Application**: Always applies speaker color to text nodes
3. **Format Preservation**: Preserves bold/italic/underline when converting
4. **Label Creation**: Always creates `SpeakerLabelDecorator` with format: `"{label}: "`
5. **Group ID**: Always generates new `groupId` (except when removing label)
6. **FEFF Usage**: Used in empty cases for cursor positioning (except Case 1b which is commented out)

---

## Questions to Consider

1. **Do we need all these cases?** Some might be edge cases that rarely occur
2. **Can we simplify?** Case 3b-i and 3b-ii could potentially be merged
3. **Is fallback needed?** When would Case 4 actually trigger?
4. **FEFF consistency**: Why is Case 1b commented out but others use it?

