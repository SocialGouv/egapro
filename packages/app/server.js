const express = require("express");
const path = require("path");
const app = express();
const { createProxyMiddleware: proxy } = require('http-proxy-middleware');

const apiURL = process.env.REACT_APP_API_URL;
if (apiURL) {
  console.log("[frontend] Proxying all calls to /api to ", apiURL);
  app.use("/api", proxy({ target: apiURL, changeOrigin: true }));
}

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(9000);
