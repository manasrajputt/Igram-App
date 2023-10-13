const express = require('express');
const router = express.Router();
const UserModel = require('./users');
const PostModel = require('./posts');
const passport = require('passport');
const multer = require("multer");
const path = require('path');
const fs = require('fs');

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
  res.render('index', { title: 'Express' });
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

router.get('/profile', isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .populate("posts")
    .then(function (alldata) {
      // console.log(alldata)
      res.render("profile", { data: alldata });
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
          image: req.body.image,
          contact: req.body.contact
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


router.post("/post", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      PostModel.create({
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
        .then(function (allpost) {
          // console.log(allpost);
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

router.get("/delete/:postid", isLoggedIn, function (req, res, next) {
  UserModel.findOne({ username: req.session.passport.user })
    .then(function (foundUser) {
      PostModel.deleteOne({ _id: req.params.postid })
        .then(function (post) {
          foundUser.posts.splice(foundUser.posts.indexOf(post._id), 1);
          foundUser.save();
          // console.log(foundUser,post);
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
