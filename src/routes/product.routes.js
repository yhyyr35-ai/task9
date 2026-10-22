const express = require("express");
const router = express.Router();
const productController = require("../controllers/product.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const id = require("../middlewares/id");
const asyncHandler = require("../utils/asyncHandler");
const { createProductValidation, updateProductValidation } = require("../validation/product.validate");

router.get("/", auth.optionalAuth, asyncHandler(productController.getProducts));
router.get("/:id", id, auth.optionalAuth, asyncHandler(productController.getProductById));

router.post("/", auth, role(["admin", "employee"]), createProductValidation, asyncHandler(productController.createProduct));
router.put("/:id", id, auth, role(["admin", "employee"]), updateProductValidation, asyncHandler(productController.updateProduct));
router.delete("/:id", id, auth, role(["admin", "employee"]), asyncHandler(productController.deleteProduct));

module.exports = router;
