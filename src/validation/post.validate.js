const { body, param } = require("express-validator");
const validation = require("../middlewares/validation");

const addPostValidation = [
    body("content")
        .not().isEmpty().withMessage("Content is required")
        .isString().withMessage("Content must be string")
        .isLength({ max: 280, min: 3 }).withMessage("Content length must be between 3 - 280 characters"),

    body("status")
        .not().isEmpty().withMessage("Content is required")
        .isString().withMessage("Status must be string")
        .isIn(["Sad", "Happy", "Funny"]).withMessage('Status must be in ["Sad", "Happy", "Funny"]'),

    validation
];

module.exports = {
    addPostValidation
};