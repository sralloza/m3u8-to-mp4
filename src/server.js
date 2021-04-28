const converter = require("node-m3u8-to-mp4");
const express = require("express");
const formidable = require("formidable");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const app = express();

var htmlFile = null;
var cssFile = null;

fs.readFile("./src/index.html", function (err, html) {
  if (err) console.warn("Error opening index.html: " + err);
  htmlFile = html;
});

fs.readFile("./src/style.css", function (err, css) {
  if (err) console.warn("Error opening style.css: " + err);
  cssFile = css;
});

function remove_file_ok(filepath) {
  try {
    return fs.unlinkSync(filepath);
  } catch {
    return;
  }
}

app.get("/style.css", (req, res) => {
  res.status(200).send(cssFile);
  return;
});

app.post("/fileupload", (req, res) => {
  var form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    let filepath = files["filesToConvert"]["path"];
    let videoName = files["filesToConvert"]["name"].split(".m3u8")[0];
    videoName = videoName + ".mp4";

    console.log(filepath);
    console.log(videoName);

    var videoPath = path.join(path.dirname(__dirname), videoName);
    remove_file_ok(videoPath);

    try {
      throw TypeError
      response = await convert(filepath, videoPath);
    } catch (exc) {
      res.append("Content-Type", "text/html");
      if (exc.message.indexOf("Request failed") !== -1) {
        return res
          .status(500)
          .send(`Failed download of video (${exc.message})`);
      }
      res.send("Error converting files: " + exc);
      res.send("<br>");
      console.log(exc);
      return res.send(typeof exc);
    }

    console.log("All Done");
    res.download(videoPath, videoName);

    setTimeout(() => {
      console.log("Removing file " + videoPath);
      remove_file_ok(videoPath);
    }, 30000);
  });
});

app.get("/video/:video", (req, res) => {
  videoName = req.params.video;
  res.send(videoName);
});

app.get("/", (req, res) => {
  res.append("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(htmlFile);
});

async function convert(filepath, videoPath, res) {
  await converter(
    // path.join(__dirname, "index.m3u8"),
    filepath,
    videoPath,
    (status, index, total) => {
      switch (status) {
        case "generating":
          console.log("extracting...");
          break;
        case "downloading":
          console.log(
            "downloading process:" + ((index / total) * 100).toFixed(2) + "%"
          );
          break;
        case "combining":
          console.log(
            "combining mp4 process:" + ((index / total) * 100).toFixed(2) + "%"
          );
          break;
      }
    }
  ).then(() => {
    console.log("done!");
  });
}

app.listen(PORT, () => console.info("starting server on port " + PORT));
