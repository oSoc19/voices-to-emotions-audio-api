const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

mongoose.connect(process.env.MONGODB_CONN_STRING, { useNewUrlParser: true });

module.exports = async function addDataEntry(dataEntry) {
  let db = mongoose.connection;
  await new Promise((resolve, reject) => {
    db.once('error', e => reject(e));
    db.once('open', () => resolve());
  });

  let schema = new Schema({
    user_id: ObjectId,
    created: Date,
    emotions: [
      {
        angry: Number,
        calm: Number,
        disgust: Number,
        fearful: Number,
        happy: Number,
        neutral: Number,
        sad: Number,
        surprised: Number
      }
    ],
    timestamps: [[Number, Number]]
  });

  let Model = mongoose.model("DataEntry", schema);

  Model.insertMany([dataEntry])
}
