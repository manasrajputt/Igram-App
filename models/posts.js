const mongoose = require('mongoose');


var postSchema = mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  data: String,
  date: {
    type: Date,
    default: Date.now()
  },
  postimage: {
    type: String
  },
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user"
    }
  ],
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comment"
    }
  ]
});

module.exports = mongoose.model("post", postSchema);