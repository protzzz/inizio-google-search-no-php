import express from "express";
import dotenv from "dotenv";
import searchSerperRouter from "./routes/search.serper";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", searchSerperRouter);

const publicDir = path.join(__dirname, "../public");
app.use(express.static(publicDir));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(port, () => {
  console.log(
    `Server started on port ${port}. Go visit 'http://localhost:3000'`,
  );
});
