const mongoose = require("mongoose");
const plm=require('passport-local-mongoose');

var userSchema= mongoose.Schema({
  email: String,
  username:String,
  password:String,
  profession:String,
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
  ],
  key: String
})

userSchema.plugin(plm);

module.exports=mongoose.model("user",userSchema);
