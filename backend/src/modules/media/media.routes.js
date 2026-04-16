const { Router } = require("express");
const multer = require("multer");
const path   = require("path");
const ctrl   = require("./media.controller");
const { requireAuth, optionalAuth } = require("../../middleware/auth");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../../../../uploads"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /image\/(jpeg|png|gif|webp)|video\/(mp4|quicktime|x-msvideo)|audio\/(mpeg|wav|ogg)/;
  cb(null, allowed.test(file.mimetype));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB max
});

const router = Router();

router.post(  "/upload",   requireAuth,  upload.single("file"), ctrl.upload);
router.get(   "/:mediaId", optionalAuth, ctrl.getMedia);
router.delete("/:mediaId", requireAuth,  ctrl.deleteMedia);

module.exports = router;
