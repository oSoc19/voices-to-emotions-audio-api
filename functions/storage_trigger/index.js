const path = require("path");
const https = require("https");
const rp = require("request-promise-native");

const EXTENSIONS = [".wav", ".mp3", ".aiff"];
const BUCKET_NAME = "voices-to-emotions-call-data";

// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = async (data, context) => {
  if (data.resourceState === "not_exists") return;

  let filename = data.name;
  let extension = path.extname(filename);
  if (!EXTENSIONS.includes(extension)) return;

  console.log(process.env.MONGODB_CONN_STRING);

  var options = {
    uri: `https://europe-west1-voices-to-emotions.cloudfunctions.net/mfcc?uri=https://storage.googleapis.com/${BUCKET_NAME}/${filename}`,
    json: true
  };

  let response = await rp(options);
  console.log({ response });
};
