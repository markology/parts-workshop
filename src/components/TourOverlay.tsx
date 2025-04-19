// components/TourOverlay.tsx
"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";

const LeftArrow = ({ placement }: { placement?: string }) => {
  const style = {
    transform: "translateY(-50%)",
  };
  if (placement === "top") {
    style.transform = "";
  }

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

const RightArrow = ({ placement }: { placement?: string }) => {
  const style = {
    transform: "translateY(-50%)",
  };
  if (placement === "top") {
    style.transform = "";
  }
  return (
    <div
      id="tour-modal-tooltip-arrow"
      className={`absolute ${
        placement === "top"
          ? "top-[10px] border-l-[19px] border-t-[0px] border-t-[10px]"
          : "top-1/2"
      } -right-2 w-0 h-0 
             border-t-8 border-b-8 border-l-8 
             border-transparent border-l-white`}
      style={{ transform: "translateY(-50%)" }}
    />
  );
};

const tourSteps = [
  // {
  //   target: "#sidebar",
  //   content:
  //     "This is your sidebar. Drag impressions from here into the canvas.",
  //   arrow: "left",
  //   overlayStyle: {
  //     marginLeft: 200,
  //   },
  //   posStyle: () => ({
  //     top: 200,
  //   }),
  // },
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
      "This is your impression (trailhead) list. Drag impressions from here into the canvas.",
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
  {
    target: "#trash-bucket",
    content:
      "You can drag and drop anything into this trash can to delete. (You can also press the x on trailheads, right click items and also press the delete key to delete items. This trash bucket is the most reliable unless its a trailhead inside of a part node. You will have to right click those for now.",
    arrow: "right",
    arrowPos: "top",
    posStyle: () => ({
      left: "auto",
      right: 100,
    }),
    overlayStyle: {
      width: 200,
    },
  },
  {
    target: "#save-progress",
    content:
      "You can manually save your workshop state by clicking this, however, this will autosave on tab close and every so often",
    arrow: "right",
    arrowPos: "top",
    posStyle: () => ({
      left: "auto",
      right: 100,
    }),
    overlayStyle: {
      width: 200,
    },
  },
  {
    target: "#log-out",
    content: "This will bring you to log out screen",
    arrow: "right",
    arrowPos: "top",
    posStyle: () => ({
      left: "auto",
      right: 100,
    }),
    overlayStyle: {
      width: 200,
    },
  },
  {
    target: "#theme-toggle",
    content: "This will toggle light and dark theme",
    arrow: "right",
    arrowPos: "top",
    posStyle: () => ({
      left: "auto",
      right: 100,
    }),
    overlayStyle: {
      width: 200,
    },
  },
  {
    target: "#",
    content:
      "Please watch a quick sample video to better understand the workflow. At this stage, it isn't intuitive enough and will be worked on :)",
    arrow: "none",
    videoModal: true,
  },
];

export default function TourOverlay() {
  const [stepIndex, setStepIndex] = useState(0);
  const step = tourSteps[stepIndex];
  const [targetEl, setTargetEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (stepIndex >= tourSteps.length) {
      exit();
      return;
    }
    if (!step?.target || step.videoModal) return;
    const el = document.querySelector(step.target) as HTMLElement | null;
    if (el) setTargetEl(el);
  }, [step?.target, stepIndex]);

  const next = () => setStepIndex((i) => i + 1);
  const prev = () => setStepIndex((i) => Math.max(i - 1, 0));
  const exit = () => setStepIndex(-1);

  if (!targetEl || stepIndex === -1 || !step) return null;

  const rect = targetEl.getBoundingClientRect();

  if (step.videoModal) {
    return (
      <Modal show={step.videoModal} onClose={exit}>
        <p>{step.content}</p>
      </Modal>
    );
  }

  return (
    <div id="tour-modal" className="fixed inset-0 pointer-events-none z-[9999]">
      <div
        className="fixed inset-0 bg-[#1f1f1fb8] z-[9998]"
        style={step.overlayStyle || {}}
      />

      <div
        className="absolute p-6  bg-white rounded-lg shadow-xl border max-w-sm text-black pointer-events-auto z-[9999999] text-right pt-10"
        style={{
          top: rect.top + 8,
          ...(step?.posStyle?.() || { left: rect.right }),
        }}
      >
        {step.arrow === "left" && <LeftArrow placement={step.arrowPos} />}
        {step.arrow === "right" && <RightArrow placement={step.arrowPos} />}
        <button className="absolute top-2 right-4" onClick={exit}>
          X
        </button>

        <p className="m-0 font-bold text-left pb-6">{step.content}</p>
        <div className="flex justify-between text-sm font-semibold">
          <button
            className="text-sm font-semibold bg-[#c5d8e0] py-1 px-3 rounded-lg"
            onClick={prev}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button
            className="text-sm font-semibold bg-[#c5d8e0] py-1 px-3 rounded-lg"
            onClick={next}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
