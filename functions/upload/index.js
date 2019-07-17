const { Storage } = require("@google-cloud/storage");
const formidable = require("formidable-serverless");
const fs = require("fs");
const path = require("path");

const storage = new Storage();
const BUCKET_NAME = "voices-to-emotions-call-data";
const TEMP_DIR = "/tmp";
const HASH_ALGORYTHM = "sha256";

function hashFromReadableStream(stream) {
  return new Promise((resolve, reject) => {
    stream
      .pipe(crypto.createHash(HASH_ALGORYTHM).setEncoding("hex"))
      .on("finish", function() {
        resolve(this.read());
      })
      .on("error", reject);
  });
}

function hashFromFilePath(filePath) {
  return hashFromReadableStream(fs.createReadStream(filePath));
}

exports.upload = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Content-Type", "application/json");

  if (req.method.toLowerCase() !== "post") {
    console.error("Bad Request, only POST allowed!");
    res.statusCode = 400;
    res.end(JSON.stringify({ type: "error", message: "Bad Request" }));
    return;
  }

  try {
    let form = new formidable.IncomingForm();
    form.uploadDir = TEMP_DIR;
    form.parse(req, (err, fields, files) => {
      console.log({ err, fields, files });

      if (err) throw err;

      if (!files.audio || !fields.user_id) {
        res.statusCode = 400;
        res.end(JSON.stringify({ type: "error", message: "Bad request" }));
        return;
      }

      let filepath = files.audio.path;
      let filehash = await hashFromFilePath(filepath);
      let target_path = `${userId}/${Date.now()}-${filehash}${path.extname(
        files.audio.name
      )}`;

      await storage.bucket(BUCKET_NAME).upload(filepath, {
        destination: target_path,
        gzip: true,
        metadata: {
          cacheControl: "public, max-age=31536000"
        }
      });

      res.statusCode = 200;
      res.end(JSON.stringify({ type: "success", message: "Upload completed" }));
    });
  } catch (e) {
    console.error(e);

    res.statusCode = 500;
    res.end(JSON.stringify({ type: "error", message: "Error occured" }));
    return;
  }
};
