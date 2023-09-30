
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs")

mongoose.connect("mongodb://127.0.0.1:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const secret = process.env.SECRET;
userSchema.plugin(encrypt, { secret: secret, encryptedFields: ["password"] });

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
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        });
        await newUser.save();
    } catch (err) {
        console.log(err);
    } finally {
        res.render("secrets");
    }
});

app.post("/login", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const foundUsername = await User.findOne(
        {email: username}
    ).catch((err) => console.log(err));
    if (foundUsername) {
        const foundPassword = await User.findOne(
            {password: password}
        ).catch((err) => console.log(err));
        res.render("secrets");
    } else {
        res.send("Wrong login details");
    }
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});