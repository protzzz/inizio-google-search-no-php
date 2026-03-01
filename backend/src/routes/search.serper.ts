import { Request, Response, Router } from "express";

interface SerperResponse {
  organic?: {
    title?: string;
    link?: string;
    snippet?: string;
  }[];
}

const searchSerperRouter = Router();

searchSerperRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (!query) {
      return res.status(400).json({ error: "No query param" });
    }

    const total = req.query.num ? Number(req.query.num) : 10;
    const start = req.query.start ? Number(req.query.start) : 1;

    if (!Number.isFinite(total) || total < 1 || total > 10) {
      return res.status(400).json({ error: "Invalid total number" });
    }

    if (!Number.isFinite(start) || start < 1) {
      return res.status(400).json({ error: "Invalid start number" });
    }

    const serperKey = process.env.SERPER_API_KEY;

    if (!serperKey) {
      return res.status(500).json({ error: "Missing SERPER_API_KEY" });
    }

    // start=1..10 -> page 1, start=11..20 -> page 2
    const page = Math.floor((start - 1) / total) + 1;

    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: total,
        page,
        gl: "cz",
      }),
    });

    const contentType = response.headers.get("Content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return res.status(502).json({
        error: "Serper API request failed",
        status: response.status,
        details: raw,
      });
    }

    // title, link, snippet
    const data = raw as SerperResponse;
    const items = Array.isArray(data.organic) ? data.organic : [];

    const results = items.map((item: any, index: number) => ({
      position: (page - 1) * total + (index + 1),
      title: String(item?.title ?? ""),
      link: String(item?.link ?? ""),
      snippet: String(item?.snippet ?? ""),
    }));

    const format = String(req.query.format ?? "json").toLowerCase();

    if (format === "json") {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="results.json"`,
      );

      return res.status(200).json({
        query,
        page,
        total,
        results,
      });
    }

    return res.status(400).json({ error: "Invalid format. Use JSON." });
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

export default searchSerperRouter;
