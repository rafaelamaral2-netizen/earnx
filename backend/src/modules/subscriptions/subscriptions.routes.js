const { Router } = require("express");
const ctrl = require("./subscriptions.controller");
const { requireAuth, optionalAuth } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");

const router = Router();

router.get(   "/",                    requireAuth,              ctrl.mySubscriptions);
router.get(   "/subscribers",         requireAuth, requireRole("creator","admin"), ctrl.mySubscribers);
router.get(   "/plans/:creatorId",    optionalAuth,             ctrl.getPlans);
router.post(  "/plans",               requireAuth, requireRole("creator","admin"), ctrl.setPlans);
router.post(  "/:creatorId",          requireAuth,              ctrl.subscribe);
router.delete("/:creatorId",          requireAuth,              ctrl.cancel);

module.exports = router;
