const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const id = require("../middlewares/id");
const asyncHandler = require("../utils/asyncHandler");
const { createOrderValidation, updateOrderStatusValidation } = require("../validation/order.validate");

router.use(auth);

router.post("/", role(["customer"]), createOrderValidation, asyncHandler(orderController.createOrder));
router.get("/my-orders", role(["customer"]), asyncHandler(orderController.getMyOrders));
router.get("/", role(["admin", "employee"]), asyncHandler(orderController.getAllOrders));
router.get("/:id", id, asyncHandler(orderController.getOrderById));
router.patch("/:id/status", id, role(["admin", "employee"]), updateOrderStatusValidation, asyncHandler(orderController.updateOrderStatus));

module.exports = router;
