const { body } = require("express-validator");
const validation = require("../middlewares/validation");

const createOrderValidation = [
    body("items")
        .isArray({ min: 1 }).withMessage("Order must contain at least one item"),

    body("items.*.productId")
        .notEmpty().withMessage("Product ID is required")
        .isMongoId().withMessage("Invalid Product ID"),

    body("items.*.size")
        .trim()
        .notEmpty().withMessage("Product size/quantity option is required"),

    body("items.*.quantity")
        .notEmpty().withMessage("Quantity is required")
        .isInt({ min: 1 }).withMessage("Quantity must be at least 1"),

    body("deliveryAddress")
        .optional()
        .trim(),

    body("addressId")
        .optional()
        .isMongoId().withMessage("Invalid Address ID"),

    body().custom((body) => {
        if (!body.deliveryAddress && !body.addressId) {
            throw new Error("Either deliveryAddress or addressId must be provided");
        }
        return true;
    }),

    validation
];

const updateOrderStatusValidation = [
    body("status")
        .trim()
        .notEmpty().withMessage("Status is required")
        .isIn(["Pending", "Approved", "Preparing", "Out for Delivery", "Completed", "Rejected"])
        .withMessage("Invalid order status"),

    validation
];

module.exports = {
    createOrderValidation,
    updateOrderStatusValidation
};
