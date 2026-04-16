const { Router } = require("express");
const ctrl = require("./profiles.controller");
const { requireAuth, optionalAuth } = require("../../middleware/auth");

const router = Router();

router.get(   "/:username", optionalAuth, ctrl.getProfile);
router.patch( "/me",        requireAuth,  ctrl.updateProfile);

module.exports = router;
