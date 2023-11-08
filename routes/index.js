const express = require('express');
const router = express.Router();
const UserModel = require('../models/users.js')
const PostModel = require('../models/posts.js');
const CommentModel = require('../models/comments.js');
const passport = require('passport');
const multer = require("multer");
const path = require('path');
const fs = require('fs');
const nodemailer = require('../nodemailer');
const crypto = require("crypto");
const mongoose=require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.mongodb_url).then(() => {
  console.log("db connected");
}).catch(err => {
  console.log(err);
})

const localStrategy = require('passport-local')
passport.use(new localStrategy(UserModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

/* GET home page. */
router.get('/', function (req, res, next) {
  res.redirect("/login")
});

router.post('/uploadimg', isLoggedIn, upload.single("image"), function (req, res, next) {
  UserModel
    .findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      if (founduser.image !== 'def.png') {
        fs.unlinkSync(`./public/images/uploads/${founduser.image}`);
      }
      founduser.image = req.file.filename;
      founduser.save()
        .then(function () {
          res.redirect("back");
        })
    });
});

router.get('/forgot', function (req, res, next) {
  res.render('forgot');
});

router.get('/forgot/:userid/:key', async function (req, res, next) {
  let user = await UserModel.findById({ _id: req.params.userid })
  if (user.key === req.params.key) {
    res.render("reset", { user })
  }
  else {
    res.send("link expire");
  }
})

router.post('/forgot', async function (req, res, next) {
  var user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    res.send("we've sent a mail, if email exists.");
  }
  else {
    // user ke liye ek key banao
    crypto.randomBytes(80, async function (err, buff) {
      // console.log(buff);
      let key = buff.toString("hex");
      // console.log(key);
      user.key = key;
      await user.save();
      await nodemailer(req.body.email, user._id, key)
    })
  }
});

router.post("/reset/:userid", async function (req, res, next) {
  let user = await UserModel.findOne({ _id: req.params.userid })
  user.setPassword(req.body.password, async function () {
    user.key = "";
    await user.save();
    req.logIn(user, function () {
      res.redirect("/profile");
    })
  })
})


router.get('/profile', isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .populate({
      path: 'posts',
      populate:{
        path:'comments',
        populate:{
          path:'userid'
        }
      }
    })
    .then(function (alldata) {
      // console.log(alldata);
      res.render("profile", { data: alldata });
    })
})

router.get('/postcomments/:postid', isLoggedIn, function (req, res, next) {
  CommentModel.find({ postid: req.params.postid })
    .populate("userid")
    .then(function (allcommnets) {
      // console.log(allcommnets)
      res.json({ allcommnets })
    })
})


router.get('/editinfo', isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (alldata) {
      // console.log(alldata)
      res.render("edit", { data: alldata });
    })
});

router.post('/updateinfo', isLoggedIn, function (req, res) {
  UserModel.findOneAndUpdate({ username: req.session.passport.user }, {
    username: req.body.username,
    age: req.body.age,
    profession: req.body.profession
  }, { new: true })
    .then(function (updateUser) {
      req.login(updateUser, function (err) {
        if (err) { return next(err); }
        return res.redirect('/profile');
      });
    })
})

router.get('/check/:username', function (req, res, next) {
  UserModel.findOne({ username: req.params.username })
    .then(function (user) {
      if (user) {
        res.json(true);
      }
      else {
        res.json(false);
      }
    })
});

router.get('/login', function (req, res, next) {
  res.render("login");
});

router.get('/register', function (req, res, next) {
  res.render("register");
});

router.post('/register', function (req, res, next) {
  UserModel.findOne({ username: req.body.username })
    .then(function (foundUser) {
      // foundUser-> null/username
      if (foundUser) {
        // run when there is user with same username
        res.send("username already exits");
      }
      else {
        // run when there is no user with this username
        var newUser = new UserModel({
          email: req.body.email,
          username: req.body.username,
          age: req.body.age,
          profession: req.body.profession,
          image: req.body.image,
          // contact: req.body.contact
        })
        UserModel.register(newUser, req.body.password)
          .then(function (usercreated) {
            passport.authenticate('local')(req, res, function () {
              res.redirect('/profile');
            })
          })
          .catch(function (e) {
            res.send(e);
          })
      }
    })
})

router.post('/login', passport.authenticate('local', {
  successRedirect: '/profile',
  failureRedirect: '/login'
}), function (req, res, next) { });

router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('/login');
  })
})


router.post("/post", isLoggedIn, upload.single("postimage"), function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      PostModel.create({
        postimage: req.file.filename,
        data: req.body.post,
        userid: foundUser._id
      })
        .then(function (createdpost) {
          foundUser.posts.push(createdpost._id);
          foundUser.save()
            .then(function () {
              res.redirect("back");
            })
        })
    })
})

router.get("/feed", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (user) {
      PostModel.find()
        .populate("userid")
        .populate({
          path: 'comments',
          populate: {
            path: 'userid'
          }
        })
        .then(function (allpost) {
          // console.log(allpost[0].comments)
          res.render("feed", { allpost, user });
        })
    })
})

router.get("/like/:postid", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      PostModel.findOne({ _id: req.params.postid })
        .then(function (post) {
          if (post.likes.indexOf(foundUser._id) === -1) {
            post.likes.push(foundUser._id);
          }
          else {
            post.likes.splice(post.likes.indexOf(foundUser._id), 1);
          }
          post.save()
            .then(function () {
              // console.log(foundUser,post);
              res.redirect('back');
            })
        })
    })
})

router.post("/comment/:postid", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      // console.log(foundUser._id);
      // find out which post you are commenting
      const id = req.params.postid;
      // get the comment text and record user id
      const comment = new CommentModel({
        text: req.body.comment,
        userid: foundUser._id,
        postid: id
      })
      // save comment
      comment.save()
        .then(function () {
          // get this particular post
          PostModel.findById(id)
            .then(function (postRelated) {
              // push the comment into the post.comments array
              // save and redirect...
              postRelated.comments.push(comment);
              postRelated.save()
                .then(function () {
                  // console.log(postRelated);
                  res.redirect('back');
                })
            })
        })
    })
})

router.get("/delete/:postid", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      PostModel.findOne({ _id: req.params.postid })
        .then(function (postdata) {
          // console.log(postdata.postimage);
          fs.unlinkSync(`./public/images/uploads/${postdata.postimage}`);
        })
      // console.log(foundUser.posts[0].postimage);
      PostModel.deleteOne({ _id: req.params.postid })
        .then(function (post) {
          foundUser.posts.splice(foundUser.posts.indexOf(req.params.postid), 1);
          foundUser.save();
          console.log(post);
          res.redirect('back');
        })
    })
})

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    res.redirect('/login')
  }
}

module.exports = router;
