import { useEffect, useState } from "react";

import Modal from "./Modal";

// your modal component

export default function OnboardingModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("seenTutorial");
    if (!hasSeen) {
      setShow(true);
      localStorage.setItem("seenTutorial", "true");
    }
  }, []);

  return (
    <Modal show={show} onClose={() => setShow(false)} width="100vw" full>
      <div className="p-20 bg-black rounded-lg shadow-xl w-full align-center justify-center p-[100px]">
        <h2 className="text-lg text-white text-center font-semibold mb-4">
          Welcome to Parts Studio - Please watch the tutorial :)
        </h2>
        <video
          src="/parts-workshop.mp4"
          controls
          preload="metadata"
          className="w-full rounded-lg shadow-md mb-4"
        >
          Your browser does not support the video tag.
        </video>
        <div className="flex justify-end">
          <button
            onClick={() => setShow(false)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Proceed to studio
          </button>
        </div>
      </div>
    </Modal>
  );
}
