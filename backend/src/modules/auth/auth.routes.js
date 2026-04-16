const { Router } = require("express");
const ctrl = require("./auth.controller");
const { requireAuth } = require("../../middleware/auth");

const router = Router();

router.post("/register",        ctrl.register);
router.post("/login",           ctrl.login);
router.post("/logout",          ctrl.logout);
router.post("/refresh",         ctrl.refresh);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password",  ctrl.resetPassword);
router.get( "/me",              requireAuth, ctrl.me);

module.exports = router;
