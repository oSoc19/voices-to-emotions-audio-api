import os, math, tempfile, gc, requests
import librosa
import numpy as np
from flask import jsonify

# Google AI
from googleapiclient import discovery

ALLOWED_EXTENSIONS = ['aiff', 'wav', 'mp3']
MFCC_FEATURES = 12
MFCC_LENGTH = 200
SILENCE_TRESHOLD = 50

emotion_dict = {
    0: 'neutral',
    1: 'calm',
    2: 'happy',
    3: 'sad',
    4: 'angry',
    5: 'fearful',
    6: 'disgust',
    7: 'surprised'
}


def save_from_uri(uri):
    req = requests.get(uri)
    if req.status_code == 200:
        temp_dir = tempfile.gettempdir()
        extension = uri.rsplit('.', 1)[1].lower()
        file_path = os.path.join(temp_dir, 'temp.' + extension)

        print(req.encoding)
        print(req.content)
        if req.encoding == 'UTF-8':
            raise Exception('Invalid file type')

        with open(file_path, 'wb') as f:
            f.write(req.content)

        return file_path, extension

    raise Exception('Invalid file type')


def map_predictions(predictions):
    res = []
    for p in predictions:
        classes = p["classes"]
        mapped_classes = {}

        for i in range(0, len(classes)):
            mapped_classes[emotion_dict[i]] = round(classes[i] * 10000) / 10000

        res.append(mapped_classes)

    return res


def get_predictions(instances):
    project = 'voices-to-emotions'
    model = 'emotionrecognition'
    version = 'v2'

    service = discovery.build('ml', 'v1')
    name = 'projects/{}/models/{}'.format(project, model)

    if version is not None:
        name += '/versions/{}'.format(version)

    response = service.projects().predict(
        name=name,
        body={'instances': instances}
    ).execute()

    if 'error' in response:
        raise RuntimeError(response['error'])

    return response['predictions']


def load_audio_data(file_path):
    # 16000 Hz = VoIP
    wave, sr = librosa.load(file_path, mono=True, sr=16000)
    wave_frag_offsets = librosa.effects.split(wave, top_db=SILENCE_TRESHOLD)

    results = []
    timestamps = []
    for offsets in wave_frag_offsets:
        start_sec = offsets[0] / sr
        last_secs = start_sec
        frag_duration = (offsets[1] - offsets[0]) / sr

        wave_fragment = wave[offsets[0]:offsets[1]]
        mfcc = librosa.feature.mfcc(wave_fragment, sr, n_mfcc=MFCC_FEATURES)
        _, y_size = mfcc.shape

        splitted_mfcc = np.array_split(mfcc, math.ceil(y_size / MFCC_LENGTH), axis=1)

        one_mfcc_secs = frag_duration / y_size

        for short_mfcc in splitted_mfcc:
            mfcc_len = len(short_mfcc[0])
            short_mfcc = np.pad(short_mfcc, ((0, 0), (0, MFCC_LENGTH - len(short_mfcc[0]))), mode='constant',
                                constant_values=0)
            results.append(np.array(short_mfcc).tolist())

            duration = one_mfcc_secs * mfcc_len
            timestamps.append([last_secs, last_secs + duration])
            last_secs += duration

    return results, timestamps


def mfcc(request):
    if not request.method == 'GET':
        return jsonify({
            "type": 'error',
            "message": "Unknown request"
        })

    uri = request.args['uri']
    if uri:
        file_path, extension = save_from_uri(uri)

        if extension in ALLOWED_EXTENSIONS:
            mfcc, timestamps = load_audio_data(file_path)
            gc.collect()

            predictions = map_predictions(get_predictions(mfcc))
            gc.collect()

            # Remove the file, KEEP THIS AT THE END!
            os.remove(file_path)

            return jsonify({
                "type": 'success',
                "data": {
                    'timestamps': timestamps,
                    'emotions': predictions
                }
            })

        else:
            return jsonify({
                "type": 'error',
                "message": "Invalid filetype"
            })

    else:
        return jsonify({
            "type": 'error',
            "message": "Please provide a file"
        })
