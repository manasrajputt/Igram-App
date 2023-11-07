const mongoose = require("mongoose");
const plm=require('passport-local-mongoose');
require('dotenv').config();

mongoose.connect(process.env.mongodb_url).then(() => {
  console.log("db connected");
}).catch(err => {
  console.log(err);
})

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
