const { Router } = require("express");
const ctrl = require("./discover.controller");
const { optionalAuth } = require("../../middleware/auth");

const router = Router();

router.get("/trending",    optionalAuth, ctrl.getTrending);
router.get("/creators",    optionalAuth, ctrl.getCreators);
router.get("/search",      optionalAuth, ctrl.search);
router.get("/recommended", optionalAuth, ctrl.getRecommended);

module.exports = router;
