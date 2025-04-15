import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    try {
      const redirectUrl = `/api/auth/signout?callbackUrl=/`;

      res.writeHead(302, { Location: redirectUrl });
      res.end();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
