const path = require("path");
const https = require("https");
const rp = require("request-promise-native");
const addDataEntry = require("./mongodb");

const EXTENSIONS = [".wav", ".mp3", ".aiff"];
const BUCKET_NAME = "voices-to-emotions-call-data";

// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = async (data, context) => {
  if (data.resourceState === "not_exists") return;

  let filename = data.name;
  let extension = path.extname(filename);
  if (!EXTENSIONS.includes(extension)) return;

  let fileparts = filename.split("/");
  let user_id = fileparts[0];
  let timestamp = fileparts[1].split("-")[0];

  console.log({ user_id, timestamp });

  if (!user_id || isNaN(timestamp)) {
    throw new Error("Invalid file format");
    return;
  }

  var options = {
    uri: `https://europe-west1-voices-to-emotions.cloudfunctions.net/mfcc?uri=https://storage.googleapis.com/${BUCKET_NAME}/${filename}`,
    json: true
  };

  let response = await rp(options);
  if (response.type === "success") {
    let data = response.data;

    await addDataEntry({
      emotions: data.emotions,
      timestamps: data.timestamps,
      feedback: Math.random(),
      created: new Date(parseInt(timestamp)),
      user_id
    });
  }
};
