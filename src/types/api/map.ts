/* eslint-disable @typescript-eslint/no-explicit-any */

import { SidebarImpression } from "../Sidebar";

export type Map = {
  id: string;
  title: string;
  sidebarImpressions: SidebarImpression[];
  nodes: any[];
  edges: any[];
};
