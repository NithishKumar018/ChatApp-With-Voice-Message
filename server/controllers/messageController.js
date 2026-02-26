const Message = require("../models/Message");
const Chat = require("../models/Chat");

// @desc    Send a new message
// @route   POST /api/messages
const sendMessage = async (req, res) => {
    const { chatId, content, messageType, fileUrl, fileName } = req.body;

    if (!chatId) {
        return res.status(400).json({ message: "chatId is required" });
    }

    try {
        let message = await Message.create({
            sender: req.user._id,
            chat: chatId,
            content: content || "",
            messageType: messageType || "text",
            fileUrl: fileUrl || "",
            fileName: fileName || "",
            seenBy: [req.user._id],
        });

        message = await message.populate("sender", "name profilePicture");
        message = await message.populate("chat");
        message = await Message.populate(message, {
            path: "chat.users",
            select: "name email profilePicture",
        });

        // Update latest message in chat
        await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all messages for a chat
// @route   GET /api/messages/:chatId
const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ chat: req.params.chatId })
            .populate("sender", "name profilePicture email")
            .populate("chat");

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark messages as seen
// @route   PUT /api/messages/seen/:chatId
const markAsSeen = async (req, res) => {
    try {
        await Message.updateMany(
            {
                chat: req.params.chatId,
                seenBy: { $ne: req.user._id },
            },
            { $addToSet: { seenBy: req.user._id } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { sendMessage, getMessages, markAsSeen };
