const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

mongoose.connect(process.env.MONGODB_CONN_STRING, { useNewUrlParser: true });

let Model = mongoose.model(
  "DataEntry",
  new Schema({
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
  })
);

module.exports = async function addDataEntry(dataEntry) {
  await Model.insertMany([dataEntry]);
};
