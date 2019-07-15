const path = require("path");
const https = require('https');

const EXTENSIONS = [".wav", ".mp3", ".aiff"];
const BUCKET_ROOT_URL =
  "https://storage.cloud.google.com/voices-to-emotions-call-data/";

// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = (data, context) => {
  if (data.resourceState === "not_exists") return;

  let filename = data.name;
  let extension = path.extname(filename);
  if (!EXTENSIONS.includes(extension)) return;

  let url = BUCKET_ROOT_URL + filename;
  let response = await new Promise(resolve => https.request({
    
  }, resolve);
  console.log({ url });
};
