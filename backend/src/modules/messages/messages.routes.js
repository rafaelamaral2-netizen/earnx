const { Router } = require("express");
const ctrl = require("./messages.controller");
const { requireAuth } = require("../../middleware/auth");

const router = Router();

router.get(  "/conversations",              requireAuth, ctrl.listConversations);
router.post( "/conversations",              requireAuth, ctrl.getOrCreateConversation);
router.get(  "/conversations/:convId",      requireAuth, ctrl.getMessages);
router.post( "/conversations/:convId",      requireAuth, ctrl.sendMessage);
router.patch("/conversations/:convId/read", requireAuth, ctrl.markRead);

module.exports = router;
