const { body } = require("express-validator");
const validation = require("../middlewares/validation");
const Category = require("../models/Category");

const createCategoryValidation = [
    body("name")
        .trim()
        .notEmpty().withMessage("Category name is required")
        .custom(async (val) => {
            const category = await Category.findOne({ name: val });
            if (category) {
                throw new Error("Category name already exists");
            }
            return true;
        }),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean"),

    validation
];

const updateCategoryValidation = [
    body("name")
        .optional()
        .trim()
        .notEmpty().withMessage("Category name cannot be empty")
        .custom(async (val, { req }) => {
            const category = await Category.findOne({ name: val, _id: { $ne: req.params.id } });
            if (category) {
                throw new Error("Category name already exists");
            }
            return true;
        }),

    body("description")
        .optional()
        .isString().withMessage("Description must be a string"),

    body("isActive")
        .optional()
        .isBoolean().withMessage("isActive must be a boolean"),

    validation
];

module.exports = {
    createCategoryValidation,
    updateCategoryValidation
};
