import express from "express";

const app = express();
const port = Number(process.env.PORT ?? 3010);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "deepprompt-api",
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});
