import { ImpressionType } from "./Impressions";

export type SidebarImpression = {
  id: string;
  label: string;
  type: ImpressionType;
  createdAt?: string;
};

export type SideBarItem = {
  id: string;
  label: string;
  type: ImpressionType;
};
