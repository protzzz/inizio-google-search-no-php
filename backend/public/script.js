const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const shortInfo = document.getElementById("shortInfo");
const infoQuery = document.getElementById("infoQuery");
const infoMeta = document.getElementById("infoMeta");
const downloadButton = document.getElementById("downloadButton");
const errorBox = document.getElementById("errorBox");
const results = document.getElementById("results");

function setError(message) {
  if (!message) {
    errorBox.style.display = "none";
    errorBox.textContent = "";
    return;
  }
  errorBox.style.display = "block";
  errorBox.textContent = message;
}

function clearResults() {
  results.innerHTML = "";
}

function renderResults(items) {
  clearResults();
  if (!Array.isArray(items) || items.length === 0) return;

  const fragment = document.createDocumentFragment();

  for (const item of items) {
    const position = Number(item?.position ?? 0);
    const title = String(item?.title ?? "");
    const link = String(item?.link ?? "");
    const snippet = String(item?.snippet ?? "");

    const card = document.createElement("div");
    card.className = "result";

    const titleRow = document.createElement("div");
    titleRow.className = "title";
    titleRow.append(`${Number.isFinite(position) ? position : 0}. `);

    const a = document.createElement("a");
    a.href = link;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = title;
    titleRow.appendChild(a);

    const linkRow = document.createElement("div");
    linkRow.className = "link";
    linkRow.textContent = link;

    const snippetRow = document.createElement("div");
    snippetRow.className = "snippet";
    snippetRow.textContent = snippet;

    card.appendChild(titleRow);
    card.appendChild(linkRow);
    card.appendChild(snippetRow);

    fragment.appendChild(card);
  }

  results.appendChild(fragment);
}

function normalizeNum(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 10;
  if (n < 1) return 1;
  if (n > 10) return 10;
  return Math.floor(n);
}

function normalizeStart(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 1;
  if (n < 1) return 1;
  return Math.floor(n);
}

function buildApiUrl(q, num, start, extraParams = {}) {
  const params = new URLSearchParams({
    q,
    num: String(num),
    start: String(start),
    ...extraParams,
  });
  return `/api/search?${params.toString()}`;
}

async function runSearch(q, num, start) {
  setError("");
  clearResults();

  if (!q.trim()) {
    shortInfo.style.display = "none";
    return;
  }

  const apiUrl = buildApiUrl(q, num, start);

  infoQuery.textContent = q;
  const page = Math.ceil(start / num);
  infoMeta.textContent = ` | page=${page} | shown=`;
  shortInfo.style.display = "block";

  downloadButton.href = buildApiUrl(q, num, start, {
    format: "json",
  });

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg = data?.error
        ? String(data.error)
        : `Request failed (HTTP ${res.status})`;
      setError(msg);
      return;
    }

    const items = data?.results;
    renderResults(items);

    const shown = Array.isArray(items) ? items.length : 0;
    infoMeta.textContent = ` | page=${page} | shown=${shown}`;
  } catch (e) {
    setError(`Network error: ${e?.message ? e.message : String(e)}`);
  }
}

form.addEventListener("submit", (ev) => {
  ev.preventDefault();
  const q = input.value.trim();

  const current = new URLSearchParams(window.location.search);
  const num = normalizeNum(current.get("num") ?? "10");
  const start = normalizeStart(current.get("start") ?? "1");

  const next = new URLSearchParams();
  if (q) next.set("q", q);
  next.set("num", String(num));
  next.set("start", String(start));

  window.location.search = next.toString();
});

window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") ?? "").trim();
  const num = normalizeNum(params.get("num") ?? "10");
  const start = normalizeStart(params.get("start") ?? "1");

  input.value = q;
  runSearch(q, num, start);
});
