const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

module.exports = async function addDataEntry(dataEntry) {
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

  await Model.insertMany([dataEntry]);
  await mongoose.connection.close();
};
