const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const id = require("../middlewares/id");
const asyncHandler = require("../utils/asyncHandler");
const {
    createEmployeeValidation,
    updateEmployeeValidation,
    blockCustomerValidation
} = require("../validation/admin.validate");

router.use(auth);
router.use(role(["admin"]));

router.post("/employees", createEmployeeValidation, asyncHandler(adminController.createEmployee));
router.get("/employees", asyncHandler(adminController.getEmployees));
router.put("/employees/:id", id, updateEmployeeValidation, asyncHandler(adminController.updateEmployee));
router.delete("/employees/:id", id, asyncHandler(adminController.deleteEmployee));

router.get("/users", asyncHandler(adminController.getUsers));
router.patch("/users/:id/block", id, blockCustomerValidation, asyncHandler(adminController.blockUser));
router.patch("/users/:id/unblock", id, asyncHandler(adminController.unblockUser));

router.get("/statistics", asyncHandler(adminController.getStatistics));

module.exports = router;
