const { Storage } = require("@google-cloud/storage");
const Busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const storage = new Storage();
const BUCKET_NAME = 'voices-to-emotions-call-data';
const TEMP_DIR = '/tmp';
const HASH_ALGORYTHM = 'sha256'

function hashFromReadableStream(stream) {
  return new Promise((resolve, reject) => {
    stream
      .pipe(crypto.createHash(HASH_ALGORYTHM).setEncoding('hex'))
      .on('finish', function() {
        resolve(this.read());
      })
      .on('error', reject);
  });
}

function hashFromFilePath(filePath) {
  return hashFromReadableStream(fs.createReadStream(filePath));
}

exports.upload = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    res.statusCode = 400;
    res.end(JSON.stringify({ type: 'error', message: 'Bad Request' }));
    return;
  }

  try {
    let busboy = new Busboy({ headers: req.headers });
    let fileObject = null;
    let userId = '';
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      if (fieldname === 'audio') {
        file = {fieldname, file, filename, encoding, mimetype};
      }
    })
    busboy.on('field', (fieldname, val) => {
      if (fieldname === 'user_id') {
        userId = val
      }
    })
    let finishPromise = new Promise(resolve => busboy.on('finish', resolve));
    req.pipe(busboy);
    await finishPromise;

    if (fileObject && userId) {
      let {fieldname, file, filename, encoding, mimetype} = fileObject;
      let filepath = path.join('/tmp', filename);
      let writeStream = fs.createWriteStream(filepath);
      file.pipe(writeStream);
      await new Promise(resolve => writeStream.once('close', resolve))
  
      let filehash = await hashFromFilePath(filepath);
      let target_path = `${userId}/${Date.now()}-${filehash}${path.extname(filepath)}`
    
      await storage.bucket(BUCKET_NAME).upload(filename, {
        destination: target_path,
        gzip: true,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
      });

      res.statusCode = 200;
      res.end(JSON.stringify({ type: 'success', message: 'Upload complete' }));
      return;
    } else {
      res.statusCode = 400;
      res.end(JSON.stringify({ type: 'error', message: 'Bad request' }));
      return;
    }
  } catch(e) {
    console.error(e);

    res.statusCode = 500;
    res.end(JSON.stringify({ type: 'error', message: 'Error occured' }));
    return;
  }
};
