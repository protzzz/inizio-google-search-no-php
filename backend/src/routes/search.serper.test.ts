import request from "supertest";
import express from "express";
import searchSerperRouter from "./search.serper";

const app = express();

app.use("/api", searchSerperRouter);

describe("GET /search", () => {
  beforeEach(() => {
    process.env.SERPER_API_KEY = "test-key";
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.SERPER_API_KEY;
  });

  test("returns 400 when query is missing", async () => {
    const res = await request(app).get("/api/search");
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "No query param" });
  });

  test("returns 200 and maps organic results to results[]", async () => {
    const responseBody = {
      organic: [
        { title: "A", link: "https://a.com", snippet: "sa" },
        { title: "B", link: "https://b.com", snippet: "sb" },
      ],
    };

    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { "Content-type": "application/json" },
      }) as any,
    );

    const res = await request(app).get("/api/search?q=adele&num=10&start=1");

    expect(res.status).toBe(200);

    expect(res.body.query).toBe("adele");
    expect(res.body.total).toBe(10);
    expect(res.body.page).toBe(1);

    expect(res.body.results).toEqual([
      {
        position: 1,
        title: "A",
        link: "https://a.com",
        snippet: "sa",
      },
      {
        position: 2,
        title: "B",
        link: "https://b.com",
        snippet: "sb",
      },
    ]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  test("returns 502 when responds with error status", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad request" }), {
        status: 400,
        headers: { "Content-type": "application/json" },
      }) as any,
    );

    const res = await request(app).get("/api/search?q=test");

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("Serper API request failed");
    expect(res.body.status).toBe(400);
    expect(res.body.details).toBeDefined();
  });
});
