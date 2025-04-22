import * as Tooltip from "@radix-ui/react-tooltip";
import { ReactNode } from "react";

const ToolTipWrapper = ({
  children,
  message,
}: {
  children: ReactNode;
  message: string;
}) => {
  return (
    <Tooltip.Provider delayDuration={500}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Content
          side="left"
          sideOffset={4} // ⬆ pushes it 4px up (default)
          align="center" // ⬅ alignment (center, start, end)
          className="radix-tooltip-content px-2 py-1 bg-white text-black text-sm rounded shadow"
        >
          {message}
          <Tooltip.Arrow className="fill-white" />
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default ToolTipWrapper;
