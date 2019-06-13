const express = require("express");
const path = require("path");
const app = express();
const proxy = require("http-proxy-middleware");

const apiURL = process.env.API_URL;
if (apiURL) {
  app.use("/api", proxy({ target: apiURL, changeOrigin: true }));
}

app.use(express.static(path.join(__dirname, "build")));

app.get("/*", function(req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(9000);
