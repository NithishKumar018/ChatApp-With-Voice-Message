const express = require("express");
const {
    accessChat,
    fetchChats,
    createGroupChat,
    addToGroup,
    removeFromGroup,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").post(protect, accessChat).get(protect, fetchChats);
router.post("/group", protect, createGroupChat);
router.put("/group/add", protect, addToGroup);
router.put("/group/remove", protect, removeFromGroup);

module.exports = router;
