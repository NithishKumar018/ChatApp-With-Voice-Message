const express = require("express");
const { sendMessage, getMessages, markAsSeen } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:chatId", protect, getMessages);
router.put("/seen/:chatId", protect, markAsSeen);

module.exports = router;
