const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const auth = require("../middlewares/auth");
const role = require("../middlewares/role");
const id = require("../middlewares/id");
const asyncHandler = require("../utils/asyncHandler");
const { createAddressValidation, updateAddressValidation } = require("../validation/address.validate");

router.use(auth);
router.use(role(["customer"]));

router.post("/", createAddressValidation, asyncHandler(addressController.createAddress));
router.get("/", asyncHandler(addressController.getMyAddresses));
router.get("/:id", id, asyncHandler(addressController.getAddressById));
router.put("/:id", id, updateAddressValidation, asyncHandler(addressController.updateAddress));
router.delete("/:id", id, asyncHandler(addressController.deleteAddress));

module.exports = router;
