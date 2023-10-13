const mongoose=require('mongoose');

var postSchema= mongoose.Schema({
  userid:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"user"
  },
  data:String,
  date:{
    type:Date,
    default:Date.now()
  },
  likes:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"user"
    }
  ]
});

module.exports=mongoose.model("post",postSchema);