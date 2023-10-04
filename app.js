
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
        const newUser = new User({
            email: req.body.username,
            password: hashedPassword
        });
        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.log(err);
    }
});

app.post("/login", async (req, res) => {
    try {
        const username = req.body.username;
        const password = req.body.password;
        const foundUsername = await User.findOne(
            {email: username}
        )
        if (foundUsername) {
            const foundHashedPassword = await bcrypt.compare(password, foundUsername.password);
            if (foundHashedPassword) {
                res.render("secrets");
            } else {
                res.send("Wrong login details");
            }
        } 
    } catch (err) {
         console.log(err)
    }
    
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});