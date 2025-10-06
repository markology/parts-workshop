import type { NextApiRequest, NextApiResponse } from "next";
import { runIfsTurn } from "@/lib/aiSession";
// import { applyPatch } from "@/server/applyPatch"; // we'll stub first

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const { userMessage, mapContext } = req.body;
    // might want to pass map patch here
    const { response_text } = await runIfsTurn({ userMessage, mapContext });

    // 1) For first run, do NOT mutate DB yet:
    // const neighborhood = await applyPatch({ patch: map_patch, userId: req.user.id, mapId: req.body.mapId });

    res.status(200).json({ response_text /*, neighborhood*/ });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}