# What is a Decorator Node in Lexical?

## Yes, DecoratorNode is Part of Lexical Core

`DecoratorNode` is a built-in node type in Lexical's core library. It's designed for embedding **non-textual, interactive, or complex components** into the editor.

## Key Characteristics

### 1. **Read-Only by Default**
- Decorator nodes cannot be edited as text
- They're meant to display content, not be edited directly
- This is built into Lexical's design

### 2. **Non-Selectable (by default)**
- You can't select part of a decorator node
- It behaves like a single unit (like a character, but can't be partially selected)
- This prevents formatting issues

### 3. **Renders React Components**
- The `decorate()` method returns a React component
- This component is rendered inside the editor
- Lexical handles the React rendering for you

### 4. **Inline or Block**
- Can be `isInline(): true` (flows with text, like a character)
- Or `isInline(): false` (block-level, like a paragraph)

## Common Use Cases

1. **Media Embeds**: Images, videos, iframes
2. **Interactive Widgets**: Polls, buttons, custom components
3. **Mentions/Tags**: User mentions, hashtags (like Twitter)
4. **Read-Only Content**: Labels, badges, pills (our use case!)

## How It Works

```typescript
class SpeakerLabelDecorator extends DecoratorNode<ReactNode> {
  // 1. Define the node type
  static getType(): string {
    return "speaker-label-decorator";
  }

  // 2. Create the DOM container
  createDOM(): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  // 3. Return the React component to render
  decorate(): ReactNode {
    return <span>Speaker Label</span>;
  }
}
```

## Why We're Using It for Speaker Labels

### Before (Bold Text Node):
```typescript
// Regular text node with bold formatting
const labelText = $createTextNode("Speaker: ");
labelText.setFormat("bold");
```

**Problems**:
- ❌ Can be formatted (bold, italic, underline)
- ❌ Can be partially selected
- ❌ Can be deleted character-by-character
- ❌ Complex logic needed to prevent formatting
- ❌ Complex logic to detect if label is "touched"

### After (Decorator Node):
```typescript
// Decorator node (read-only, non-selectable)
const labelDecorator = $createSpeakerLabelDecorator(
  speakerId,
  "Speaker: ",
  color
);
```

**Benefits**:
- ✅ **Cannot be formatted** (built into decorator nodes)
- ✅ **Cannot be partially selected** (non-selectable by default)
- ✅ **Behaves like a single character** (can't delete part of it)
- ✅ **No format lock plugin needed** (for the label)
- ✅ **Simple deletion logic** (if decorator touched → delete group)

## How It Differs from Regular Nodes

| Feature | Regular Node (TextNode) | DecoratorNode |
|---------|------------------------|---------------|
| Editable | ✅ Yes | ❌ No (read-only) |
| Selectable | ✅ Yes (can select part) | ❌ No (all or nothing) |
| Formattable | ✅ Yes (bold, italic, etc.) | ❌ No |
| Renders | Text content | React component |
| Use Case | User content | UI elements, embeds |

## In Our Implementation

```typescript
// Our decorator node
export class SpeakerLabelDecorator extends DecoratorNode<ReactNode> {
  decorate(): ReactNode {
    return (
      <span
        className="inline-block font-bold text-xs px-1.5 py-0.5 rounded-full..."
        contentEditable={false}  // Extra safety (though decorators are already read-only)
      >
        {this.__label}
      </span>
    );
  }
}
```

**What happens**:
1. Lexical creates a container DOM element (from `createDOM()`)
2. Lexical renders our React component inside it (from `decorate()`)
3. The component is read-only and non-selectable automatically
4. It flows inline with text (because `isInline()` returns `true`)

## The Magic: Built-In Protection

The key advantage is that **Lexical handles the protection for us**:

- We don't need to intercept format commands
- We don't need to prevent selection
- We don't need complex logic to detect if label is "touched"
- It just works because decorator nodes are designed this way

## Summary

**DecoratorNode** is a Lexical core feature that lets us embed React components that are:
- Read-only (can't be edited)
- Non-selectable (all or nothing)
- Perfect for UI elements like our speaker labels

By using it, we get all these protections **for free** without writing complex logic to prevent formatting, selection, etc.

