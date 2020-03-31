const fileSystem = require("fs");
const path = require("path");
const converter = require("node-m3u8-to-mp4");
const formidable = require("formidable");
const http = require("http");
const fs = require("fs");

var htmlFile = null;
var cssFile = null;
var videojsFile = null;

fs.readFile("./src/index.html", function(err, html) {
  if (err) console.warn("Error opening index.html: " + err);
  htmlFile = html;
});

fs.readFile("./src/style.css", function(err, css) {
  if (err) console.warn("Error opening style.css: " + err);
  cssFile = css;
});

fs.readFile("./src/video.js", function(err, videojs) {
  if (err) console.warn("Error opening video.js: " + err);
  videojsFile = videojs;
});

function remove_file_ok(filepath){
 try{

   return fs.unlinkSync(filepath);
 } catch{
   return;
 }
}

const server = http.createServer();
server.on("request", async (req, res) => {
  console.log("HTTP " + req.method + " " + req.url);
  if (req.url == "/fileupload" && req.method.toLowerCase() === "post") {
    var form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      console.log("files:");
      console.log(files);
      let filepath = files["multipleFiles"]["path"];
      console.log(filepath);

      var videoPath = path.join(path.dirname(__dirname), "video.mp4");

      remove_file_ok(videoPath)

      try {
        response = await convert(filepath);
      } catch {
        res.setHeader("Content-Type", "text/html");
        res.write("Error");
        res.end();
      }

      fs.readFile(videoPath, (err, data) => {
        if (err) console.log(err);

        var stat = fileSystem.statSync(videoPath);

        res.setHeader("Content-Length", stat.size);
        res.setHeader("Content-Type", "	video/mp4");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=video.mp4"
        );
        res.write(data, "binary");
        res.end();

        remove_file_ok(videoPath)
      });
    });
  } else if (req.url == "/style.css") {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.write(cssFile);
    return res.end();
  } else if (req.url == "/video.js") {
    res.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8"
    });
    res.write(videojsFile);
    return res.end();
  } else {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.write(htmlFile);
    return res.end();
  }
});

async function convert(filepath) {
  await converter(
    // path.join(__dirname, "index.m3u8"),
    filepath,
    "video.mp4",
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

console.info("starting server");
server.listen(80);
