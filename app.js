
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username, name: user.name });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

  app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

  app.get("/auth/facebook",
  passport.authenticate("facebook"));

  app.get("/auth/facebook/secrets",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect("/secrets");
  });

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", async (req, res) => {
    try {
        const foundUsers = await User.find({secret: {$ne: null}});
        if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
        } else {
            res.redirect("/login");
        }
    } catch (err) {
        console.log(err);
    }   
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
});

app.post("/register", async (req, res) => {
    try {
        User.register({username: req.body.username}, req.body.password);
        await passport.authenticate("local")(req, res);
        res.render("secrets");
    } catch (err) {
        console.log(err)
        res.redirect("/register");
    }
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/secrets");
                }
            });   
            }
        });
});

app.post("/submit", async (req, res) => {
    try {
        const secret = req.body.secret;
        const foundUser = await User.findById(req.user.id);
        if (foundUser) {
            foundUser.secret = secret;
            await foundUser.save();
            res.redirect("/secrets");
        }
    } catch (err) {
        console.log(err);
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
