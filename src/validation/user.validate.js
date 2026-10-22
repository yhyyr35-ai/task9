const { body } = require("express-validator");
const validation = require("../middlewares/validation");
const User = require("../models/User");

const signUpUserValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

    body("phone")
        .trim()
        .notEmpty().withMessage("Phone is required")
        .custom(async (val) => {
            const user = await User.findOne({ phone: val });
            if (user) {
                throw new Error("This phone number is already registered");
            }
            return true;
        }),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    validation
];

const signInUserValidation = [
    body("phone")
        .trim()
        .notEmpty().withMessage("Phone is required"),

    body("password")
        .notEmpty().withMessage("Password is required"),

    validation
];

module.exports = {
    signUpUserValidation,
    signInUserValidation
};