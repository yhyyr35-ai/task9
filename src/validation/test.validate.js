const { body } = require("express-validator");
const Post = require("../models/Post");

const test = [
    body("phone").isMobilePhone(),

    body("password").isStrongPassword(),

    body("email").isEmail(),

    body("link").isURL(),

    body("title").custom(async (val) => {
        const post = await Post.findOne({ title: val });

        if (post) throw new Error("Title must be unique");

        return true;
    })
];

module.exports = test;