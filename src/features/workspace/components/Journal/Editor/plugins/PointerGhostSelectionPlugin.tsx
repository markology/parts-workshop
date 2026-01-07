"use client";

import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isTextNode } from "lexical";

/**
 * Plugin that fixes ghost selection issues by adjusting selection after pointer drag.
 * Only runs after a drag-selection (not a click) to avoid interfering with normal interactions.
 */
export default function PointerGhostSelectionPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    // Track whether this interaction was a DRAG (selection) vs a CLICK.
    let isPointerDown = false;
    let didDrag = false;
    let activePointerId: number | null = null;

    function firstTextDescendant(node: any): any | null {
      if (!node) return null;
      if ($isTextNode(node)) return node;

      if (typeof node.getChildren === "function") {
        const kids = node.getChildren();
        for (const k of kids) {
          const found = firstTextDescendant(k);
          if (found) return found;
        }
      }
      return null;
    }

    function getNextTextNode(start: any): any | null {
      let node: any = start;

      while (node) {
        // 1) try next sibling
        let sib = node.getNextSibling?.();
        while (sib) {
          const found = firstTextDescendant(sib);
          if (found) return found;
          sib = sib.getNextSibling?.();
        }

        // 2) go up and try parent's siblings
        node = node.getParent?.();
        if (!node || node.getType?.() === "root") return null;
      }

      return null;
    }

    const fixGhostSelection = () => {
      editor.update(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;

        // if click collapses selection, do nothing
        if (sel.isCollapsed()) return;

        const isBackward = sel.isBackward();
        const a = sel.anchor;
        const f = sel.focus;

        const aNode = a.getNode();
        const fNode = f.getNode();

        const aIsText = $isTextNode(aNode);
        const fIsText = $isTextNode(fNode);

        if (!aIsText && !fIsText) return;

        const aLen = aIsText ? aNode.getTextContentSize() : 0;
        const fLen = fIsText ? fNode.getTextContentSize() : 0;

        const backwardAnchorGhost = isBackward && aIsText && a.offset === 0;
        const backwardFocusGhost = isBackward && fIsText && f.offset === fLen;

        const forwardFocusGhost = !isBackward && fIsText && f.offset === 0;
        const forwardAnchorAtEnd = !isBackward && aIsText && a.offset === aLen;

        const granularity: "character" | "lineboundary" = "lineboundary";

        if (backwardAnchorGhost) sel.modify("extend", true, granularity);
        if (backwardFocusGhost) sel.modify("extend", false, granularity);

        if (forwardFocusGhost) sel.modify("extend", false, granularity);

        if (forwardAnchorAtEnd) {
          if (aIsText && fIsText) {
            const nextText = getNextTextNode(aNode);
            if (nextText) {
              sel.setTextNodeRange(nextText, 0, fNode, f.offset);
            } else {
              sel.modify("extend", true, granularity);
            }
          } else {
            sel.modify("extend", true, granularity);
          }
        }
      });
    };

    const onPointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      didDrag = false;
      activePointerId = e.pointerId;

      // capture so move/up still arrive even if pointer leaves the box
      try {
        root.setPointerCapture(e.pointerId);
      } catch {}
    };

    const onPointerMove = () => {
      if (!isPointerDown) return;
      didDrag = true;
    };

    const onPointerUp = (_e: PointerEvent) => {
      const wasDrag = didDrag;

      isPointerDown = false;
      didDrag = false;

      if (activePointerId != null) {
        try {
          root.releasePointerCapture(activePointerId);
        } catch {}
        activePointerId = null;
      }

      // only run fix after a drag-selection, not a click
      if (!wasDrag) return;

      queueMicrotask(fixGhostSelection);
    };

    const onPointerCancel = () => {
      isPointerDown = false;
      didDrag = false;

      if (activePointerId != null) {
        try {
          root.releasePointerCapture(activePointerId);
        } catch {}
        activePointerId = null;
      }
    };

    root.addEventListener("pointerdown", onPointerDown);
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerup", onPointerUp);
    root.addEventListener("pointercancel", onPointerCancel);

    return () => {
      root.removeEventListener("pointerdown", onPointerDown);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerup", onPointerUp);
      root.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [editor]);

  return null;
}
