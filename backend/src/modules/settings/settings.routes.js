const { Router } = require("express");
const ctrl = require("./settings.controller");
const { requireAuth } = require("../../middleware/auth");

const router = Router();

router.get(  "/", requireAuth, ctrl.getSettings);
router.patch("/", requireAuth, ctrl.updateSettings);

module.exports = router;
