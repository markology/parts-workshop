import JournalToggle from "./JournalToggle";
import Logout from "./Logout";
import SaveProgress from "./SaveProgress";
import ThemeToggle from "./ThemeToggle";
import TrashCan from "./TrashCan";

export default function Utilities({ saveMap }: { saveMap: () => void }) {
  return (
    <div className="fixed top-4 flex right-4 flex-col gap-2.5 z-50">
      <TrashCan />
      <SaveProgress saveMap={saveMap} />
      <Logout />
      <ThemeToggle />
      <JournalToggle />
    </div>
  );
}
