const path = require("path");
const https = require("https");
const speech = require("@google-cloud/speech");
const rp = require("request-promise-native");

const EXTENSIONS = [".wav", ".mp3", ".aiff"];
const BUCKET_NAME = "voices-to-emotions-call-data";

// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = async (data, context) => {
  if (data.resourceState === "not_exists") return;

  let filename = data.name;
  let extension = path.extname(filename);
  if (!EXTENSIONS.includes(extension)) return;

  var options = {
    uri: `https://europe-west1-voices-to-emotions.cloudfunctions.net/mfcc?uri=https://storage.googleapis.com/voices-to-emotions-call-data/${BUCKET_NAME}/${filename}`,
    json: true
  };

  let response = await rp(options);
  console.log({ response });

  // Google Cloud Speech => Text
  let speechClient = new speech.SpeechClient();
  let [operation] = await speechClient.longRunningRecognize({
    audio: { uri: `gs://${BUCKET_NAME}/${filename}` },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US"
    }
  });
  let [response] = await operation.promise();

  console.log(response);
};
