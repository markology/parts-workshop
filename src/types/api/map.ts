/* eslint-disable @typescript-eslint/no-explicit-any */

import { Edge } from "@xyflow/react";
import { ImpressionType } from "../Impressions";
import { WorkshopNode } from "../Nodes";
import { SidebarImpression } from "../Sidebar";

export type Map = {
  id: string;
  title: string;
  sidebarImpressions: Record<ImpressionType, Record<string, SidebarImpression>>;
  nodes: WorkshopNode[];
  edges: Edge[];
  //   createdAt: Date;
  //   updatedAt: Date;
};

export type SerializedMap = {
  id: string;
  title: string;
  nodes: string; // from Prisma — stored as JSON string
  edges: string;
  sidebarImpressions: string;
  userId: string;
};

export type HydratedMap = {
  id: string;
  title: string;
  nodes: WorkshopNode[];
  edges: Edge[];
  sidebarImpressions: any[];
  userId: string;
};
