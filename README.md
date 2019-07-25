# Voices To Emotions Audio API

This repository is one of the three repositories used for the voices-to-emotions project. You can find more information about this project [here](https://osoc19.github.io/voices-to-emotions/).

This is the audio api for voices to emotions. Responsible for upload, generating mfcc and uploading audio files.

You can find the other repositories here:

- https://github.com/oSoc19/voices-to-emotions
- https://github.com/oSoc19/voices-to-emotions-audio-api
- https://github.com/oSoc19/voices-to-emotions-ai

# Functions

## Internal Functions

Storage Trigger (GCP): The Storage Trigger is a function that triggers automatically whenever a file is dropped in the calldata bucket on Google Cloud.

Mfcc (GCP) [POST]: An HTTP endpoint that generates mfcc data from an audio file, the audio file should be a url. This function takes in a `uri` query parameter with the uri of the audio fragment.

## Public Functions

/api/upload (GCP) [POST]: An HTTP endpoint that takes in an audio file and drops it into the storage bucket. This function takes in multipart form data with an `audio` entry, which is an audio file and a `user_id` entry which is the target user’s id.
