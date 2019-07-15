const path = require("path");
const https = require("https");
const speech = require("@google-cloud/speech");

const EXTENSIONS = [".wav", ".mp3", ".aiff"];
const BUCKET_ROOT_URL =
  "https://storage.cloud.google.com/voices-to-emotions-call-data/";

// Background Cloud Function to be triggered by Cloud Storage.
exports.storage_trigger = async (data, context) => {
  if (data.resourceState === "not_exists") return;

  let filename = data.name;
  let extension = path.extname(filename);
  if (!EXTENSIONS.includes(extension)) return;

  let uri = BUCKET_ROOT_URL + filename;
  let response = await new Promise(resolve =>
    https.request(
      {
        hostname: "europe-west1-voices-to-emotions.cloudfunctions.net",
        port: 443,
        path: `/mfcc?uri=${uri}`,
        method: "GET"
      },
      resolve
    )
  );

  console.log(response);

  const client = new speech.SpeechClient();

  // The audio file's encoding, sample rate in hertz, and BCP-47 language code
  const request = {
    audio: { uri },
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 16000,
      languageCode: "en-US"
    }
  };

  // Detects speech in the audio file
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join("\n");
  console.log(`Transcription: ${transcription}`);

  console.log({ uri });
};
