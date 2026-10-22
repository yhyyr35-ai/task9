const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const id = require("../middlewares/id");
const asyncHandler = require("../utils/asyncHandler");
const { createCategoryValidation, updateCategoryValidation } = require("../validation/category.validate");

router.get("/", auth.optionalAuth, asyncHandler(categoryController.getCategories));
router.get("/:id", id, auth.optionalAuth, asyncHandler(categoryController.getCategoryById));

router.post("/", auth, role(["admin", "employee"]), createCategoryValidation, asyncHandler(categoryController.createCategory));
router.put("/:id", id, auth, role(["admin", "employee"]), updateCategoryValidation, asyncHandler(categoryController.updateCategory));
router.delete("/:id", id, auth, role(["admin", "employee"]), asyncHandler(categoryController.deleteCategory));

module.exports = router;
