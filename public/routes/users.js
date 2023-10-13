const mongoose = require("mongoose");
const plm=require('passport-local-mongoose');

mongoose.connect("mongodb://127.0.0.1:27017/testn15_2");

var userSchema= mongoose.Schema({
  email: String,
  username:String,
  password:String,
  age:Number,
  image:{
    type:String,
    default:"def.png"
  },
  posts:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"post"
    }
  ]
})

userSchema.plugin(plm);

module.exports=mongoose.model("user",userSchema);
