const { Router } = require("express");
const ctrl = require("./wallet.controller");
const { requireAuth } = require("../../middleware/auth");

const router = Router();

router.get( "/",                requireAuth, ctrl.getWallet);
router.get( "/transactions",    requireAuth, ctrl.getTransactions);
router.get( "/earnings",        requireAuth, ctrl.getEarnings);
router.post("/tip/:creatorId",  requireAuth, ctrl.tipCreator);
router.post("/withdraw",        requireAuth, ctrl.requestWithdrawal);

module.exports = router;
