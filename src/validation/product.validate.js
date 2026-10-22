const { body } = require("express-validator");
const validation = require("../middlewares/validation");
const Category = require("../models/Category");

const createProductValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Product name is required"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("price")
        .notEmpty().withMessage("Price is required")
        .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    body("category")
        .notEmpty().withMessage("Category is required")
        .isMongoId().withMessage("Invalid category ID")
        .custom(async (val) => {
            const category = await Category.findById(val);
            if (!category) {
                throw new Error("Category does not exist");
            }
            return true;
        }),

    body("quantityOptions")
        .optional()
        .isArray().withMessage("quantityOptions must be an array"),

    body("quantityOptions.*.size")
        .optional()
        .trim()
        .notEmpty().withMessage("Option size is required"),

    body("quantityOptions.*.price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Option price must be a positive number"),

    body("isAvailable")
        .optional()
        .isBoolean().withMessage("isAvailable must be a boolean"),

    validation
];

const updateProductValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty().withMessage("Product name cannot be empty"),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Price must be a positive number"),

    body("category")
        .optional()
        .isMongoId().withMessage("Invalid category ID")
        .custom(async (val) => {
            const category = await Category.findById(val);
            if (!category) {
                throw new Error("Category does not exist");
            }
            return true;
        }),

    body("quantityOptions")
        .optional()
        .isArray().withMessage("quantityOptions must be an array"),

    body("quantityOptions.*.size")
        .optional()
        .trim()
        .notEmpty().withMessage("Option size is required"),

    body("quantityOptions.*.price")
        .optional()
        .isFloat({ min: 0 }).withMessage("Option price must be a positive number"),

    body("isAvailable")
        .optional()
        .isBoolean().withMessage("isAvailable must be a boolean"),

    validation
];

module.exports = {
    createProductValidation,
    updateProductValidation
};
