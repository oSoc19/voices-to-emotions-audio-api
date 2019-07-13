import os, math, tempfile
import librosa
import numpy as np
import googleapiclient.discovery
from flask import jsonify
from werkzeug.utils import secure_filename

ALLOWED_EXTENSIONS = ['aiff', 'wav']
MFCC_FEATURES = 20


def get_predictions(instances):
    project = 'voices-to-emotions'
    model = 'emotionrecognition'
    version = 'v1'

    service = googleapiclient.discovery.build('ml', 'v1')
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
    wave_frag_offsets = librosa.effects.split(wave, top_db=35)

    results = []
    timestamps = []
    for offsets in wave_frag_offsets:
        start_sec = offsets[0] / sr
        last_secs = start_sec
        frag_duration = (offsets[1] - offsets[0]) / sr

        wave_fragment = wave[offsets[0]:offsets[1]]
        mfcc = librosa.feature.mfcc(wave_fragment, sr, n_mfcc=MFCC_FEATURES)
        _, y_size = mfcc.shape

        splitted_mfcc = np.array_split(mfcc, math.ceil(y_size / 500), axis=1)

        one_mfcc_secs = frag_duration / y_size

        for short_mfcc in splitted_mfcc:
            mfcc_len = len(short_mfcc[0])
            short_mfcc = np.pad(short_mfcc, ((0, 0), (0, 500 - len(short_mfcc[0]))), mode='constant', constant_values=0)
            results.append(np.array(short_mfcc).tolist())

            duration = one_mfcc_secs * mfcc_len
            timestamps.append([last_secs, last_secs + duration])
            last_secs += duration

    return results, timestamps


def mfcc_post(request):
    if not request.method == 'POST':
        return jsonify({
            "type": 'error',
            "message": "Unknown request"
        })

    # Process the audio file...
    f = request.files['audio']

    if f and f.filename:
        filename = secure_filename(f.filename)
        temp_dir = tempfile.gettempdir()
        extname = filename.rsplit('.', 1)[1].lower()
        target_path = os.path.join(temp_dir, filename)

        if extname in ALLOWED_EXTENSIONS:
            f.save(target_path)
            f.close()

            mfcc, timestamps = load_audio_data(target_path)

            os.remove(target_path)

            predictions = get_predictions(mfcc)

            return jsonify({
                "type": 'success',
                "data": {
                    'timestamps': timestamps,
                    'emotions': predictions,
                    'mfcc': mfcc
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
