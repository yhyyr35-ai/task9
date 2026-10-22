const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const auth = require("../middlewares/auth");
const asyncHandler = require("../utils/asyncHandler");
const { signUpUserValidation, signInUserValidation } = require("../validation/user.validate");

router.post("/register", signUpUserValidation, asyncHandler(authController.register));
router.post("/login", signInUserValidation, asyncHandler(authController.login));
router.post("/logout", auth, asyncHandler(authController.logout));
router.get("/me", auth, asyncHandler(authController.getMe));

module.exports = router;
