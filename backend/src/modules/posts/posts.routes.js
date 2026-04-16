const { Router } = require("express");
const ctrl = require("./posts.controller");
const { requireAuth, optionalAuth } = require("../../middleware/auth");
const requireRole = require("../../middleware/requireRole");

const router = Router();

router.get(   "/feed",                requireAuth,  ctrl.getFeed);
router.post(  "/",                    requireAuth, requireRole("creator", "admin"), ctrl.createPost);
router.get(   "/:postId",             optionalAuth, ctrl.getPost);
router.patch( "/:postId",             requireAuth,  ctrl.updatePost);
router.delete("/:postId",             requireAuth,  ctrl.deletePost);
router.post(  "/:postId/like",        requireAuth,  ctrl.likePost);
router.delete("/:postId/like",        requireAuth,  ctrl.unlikePost);
router.get(   "/:postId/comments",    optionalAuth, ctrl.getComments);
router.post(  "/:postId/comments",    requireAuth,  ctrl.addComment);
router.delete("/:postId/comments/:commentId", requireAuth, ctrl.deleteComment);

module.exports = router;
