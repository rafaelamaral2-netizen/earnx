const { Router } = require("express");
const ctrl = require("./users.controller");
const { requireAuth, optionalAuth } = require("../../middleware/auth");

const router = Router();

router.get(    "/me",                 requireAuth,  ctrl.getMe);
router.patch(  "/me",                 requireAuth,  ctrl.updateMe);
router.get(    "/:username",          optionalAuth, ctrl.getByUsername);
router.get(    "/:username/posts",    optionalAuth, ctrl.getUserPosts);
router.get(    "/:username/followers",optionalAuth, ctrl.getFollowers);
router.get(    "/:username/following",optionalAuth, ctrl.getFollowing);
router.post(   "/:userId/follow",     requireAuth,  ctrl.follow);
router.delete( "/:userId/follow",     requireAuth,  ctrl.unfollow);

module.exports = router;
