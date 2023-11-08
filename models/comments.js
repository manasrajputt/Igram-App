const mongoose = require('mongoose');
const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    postid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post"
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    }
})
module.exports = mongoose.model('comment', commentSchema);