const { body } = require("express-validator");
const validation = require("../middlewares/validation");

const createAddressValidation = [
    body("title")
        .optional()
        .trim()
        .isString().withMessage("Title must be a string"),

    body("details")
        .trim()
        .notEmpty().withMessage("Address details are required"),

    validation
];

const updateAddressValidation = [
    body("title")
        .optional()
        .trim()
        .isString().withMessage("Title must be a string"),

    body("details")
        .optional()
        .trim()
        .notEmpty().withMessage("Address details cannot be empty"),

    validation
];

module.exports = {
    createAddressValidation,
    updateAddressValidation
};
