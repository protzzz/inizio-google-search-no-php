import { Request, Response, Router } from "express";

const searchGoogleRouter = Router();

searchGoogleRouter.get("/search", async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q ?? "").trim();

    if (!query) {
      return res.status(400).json({ error: "No query param" });
    }

    const total = req.query.num ? Number(req.query.num) : 10;
    const start = req.query.start ? Number(req.query.start) : 1;

    // Number.isFinite(5) -> true
    // Number.isFinite(NaN) -> false
    // Number.isFinite(Infinity) -> false

    if (!Number.isFinite(total) || total < 1 || total > 10) {
      res.status(400).json({ error: "Invalid total number" });
      return;
    }

    if (!Number.isFinite(start) || start < 1) {
      res.status(400).json({ error: "Invalid start number" });
      return;
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CSE_ID;

    if (!apiKey || !cx) {
      res
        .status(500)
        .json({ error: "Invalid GOOGLE_API_KEY or GOOGLE_CSE_ID" });
      return;
    }

    const googleUrl = new URL("https://www.googleapis.com/customsearch/v1");

    googleUrl.searchParams.set("key", apiKey);
    googleUrl.searchParams.set("cx", cx);
    googleUrl.searchParams.set("q", query);
    googleUrl.searchParams.set("num", String(total));
    googleUrl.searchParams.set("start", String(start));

    // TEST FAILED
    // return res
    //   .status(200)
    //   .json({ query, start, total, googleUrl: googleUrl.toString() });

    const response = await fetch(googleUrl.toString());

    const contentType = response.headers.get("Content-type") ?? "";
    const raw = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      return res.status(response.status === 403 ? 403 : 502).json({
        error: "Google API request failed",
        status: response.status,
        googleUrl: googleUrl.toString(),
        details: raw,
        hint:
          response.status === 403
            ? "No access to Custom Search API (Google blocks new customers)."
            : undefined,
      });
    }

    return res.status(200).json(raw);
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

export default searchGoogleRouter;
