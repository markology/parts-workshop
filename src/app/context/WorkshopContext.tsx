import {
  createContext,
  Dispatch,
  ReactElement,
  SetStateAction,
  useContext,
  useState,
} from "react";

interface ContextValue {
  user: string | null;
  setUser: Dispatch<SetStateAction<null | string>>;
}

const WorkshopContext = createContext<ContextValue>({
  user: null,
  setUser: () => {},
});

export const WorkshopContextProvider = ({
  children,
}: {
  children: ReactElement | ReactElement[];
}) => {
  const [user, setUser] = useState<string | null>(null);

  const value = { user, setUser };
  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
};

export default WorkshopContext;

export const useWorkshopContext = () => {
  return useContext(WorkshopContext);
};
