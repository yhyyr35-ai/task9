const { body } = require("express-validator");
const validation = require("../middlewares/validation");
const User = require("../models/User");

const createEmployeeValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Employee name is required")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

    body("phone")
        .trim()
        .notEmpty().withMessage("Phone is required")
        .custom(async (val) => {
            const user = await User.findOne({ phone: val });
            if (user) {
                throw new Error("Phone number is already in use");
            }
            return true;
        }),

    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    validation
];

const updateEmployeeValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty().withMessage("Name cannot be empty")
        .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

    body("phone")
        .optional()
        .trim()
        .notEmpty().withMessage("Phone cannot be empty")
        .custom(async (val, { req }) => {
            const user = await User.findOne({ phone: val, _id: { $ne: req.params.id } });
            if (user) {
                throw new Error("Phone number is already in use");
            }
            return true;
        }),

    body("password")
        .optional()
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),

    validation
];

const blockCustomerValidation = [
    body("reason")
        .trim()
        .notEmpty().withMessage("Block reason is required"),

    validation
];

module.exports = {
    createEmployeeValidation,
    updateEmployeeValidation,
    blockCustomerValidation
};
