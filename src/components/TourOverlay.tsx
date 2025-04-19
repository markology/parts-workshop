// components/TourOverlay.tsx
"use client";

import { useEffect, useState } from "react";

const LeftArrow = ({ placement }: { placement?: string }) => {
  const style = {
    transform: "translateY(-50%)",
  };
  if (placement === "top") {
    style.transform = "";
  }

  // border-right-width: 19px;
  // border-top-width: 0px;
  // border-bottom-width: 21px;

  return (
    <div
      id="tour-modal-tooltip-arrow"
      className={`absolute ${
        placement === "top"
          ? "top-[0px] border-r-[19px] border-t-[0px] border-b-[21px]"
          : "top-1/2"
      } -left-2 w-0 h-0 
     border-t-8 border-b-8 border-r-8 
     border-transparent border-r-white`}
      style={style}
    />
  );
};

const RightArrow = () => {
  return (
    <div
      id="tour-modal-tooltip-arrow"
      className="absolute top-1/2 -right-2 w-0 h-0 
             border-t-8 border-b-8 border-l-8 
             border-transparent border-l-white"
      style={{ transform: "translateY(-50%)" }}
    />
  );
};

const tourSteps = [
  {
    target: "#sidebar",
    content:
      "This is your sidebar. Drag impressions from here into the canvas.",
    arrow: "left",
    overlayStyle: {
      marginLeft: 200,
    },
  },
  {
    target: "#create-part-button",
    content: "This button will create a new part to start workshopping",
    arrow: "left",
    arrowPos: "top",
    overlayStyle: {
      marginLeft: 200,
    },
    posStyle: () => ({
      left: 103,
    }),
  },
  {
    target: "#create-conflict-button",
    content: "This button will create a new conflict to attach parts to",
    arrow: "left",
    arrowPos: "top",
    overlayStyle: {
      marginLeft: 200,
    },
  },
  {
    target: "#create-impression-button",
    content: "This button will create new impressions (trailheads)",
    arrow: "left",
    arrowPos: "top",
    overlayStyle: {
      marginLeft: 200,
    },
  },
  {
    target: "#impression-dropdown-container",
    content:
      "This is your sidebar. Drag impressions from here into the canvas.",
    arrow: "left",
    overlayStyle: {
      marginLeft: 200,
    },
  },
  {
    target: "#canvas",
    content: "This is your workspace. Drop nodes here and connect them.",
    arrow: "right",
    posStyle: () => ({
      left: 100,
      top: 200,
    }),
    overlayStyle: {
      width: 200,
    },
  },
];

export default function TourOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = tourSteps[stepIndex];
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) setTargetEl(el);
  }, [step.target, stepIndex]);

  const next = () => setStepIndex((i) => Math.min(i + 1, tourSteps.length - 1));
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));
  const exit = () => setStepIndex(-1);
  if (!targetEl || stepIndex === -1) return null;

  const rect = targetEl.getBoundingClientRect();

  return (
    <div id="tour-modal" className="fixed inset-0 pointer-events-none z-[9999]">
      <div
        className="fixed inset-0 bg-[#1f1f1fb8] z-[9998]"
        style={step.overlayStyle || {}}
      />

      <div
        className="absolute p-4 bg-white rounded-lg shadow-xl border max-w-sm text-black pointer-events-auto z-[9999999]"
        style={{
          top: rect.top + 8,
          left: rect.right,
          ...(step?.posStyle?.() || {}),
        }}
      >
        {step.arrow === "left" ? (
          <LeftArrow placement={step.arrowPos} />
        ) : (
          <RightArrow />
        )}
        <p className="mb-2">{step.content}</p>
        <div className="flex justify-between text-sm">
          <button onClick={prev} disabled={stepIndex === 0}>
            Back
          </button>
          <button onClick={next} disabled={stepIndex === tourSteps.length - 1}>
            Next
          </button>
          <button onClick={exit}>End</button>
        </div>
      </div>
    </div>
  );
}
