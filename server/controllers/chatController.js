const Chat = require("../models/Chat");
const User = require("../models/User");

// @desc    Access or create a 1-on-1 chat
// @route   POST /api/chats
const accessChat = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: "userId param required" });
    }

    try {
        let chat = await Chat.find({
            isGroupChat: false,
            $and: [
                { users: { $elemMatch: { $eq: req.user._id } } },
                { users: { $elemMatch: { $eq: userId } } },
            ],
        })
            .populate("users", "-password")
            .populate("latestMessage");

        chat = await User.populate(chat, {
            path: "latestMessage.sender",
            select: "name email profilePicture",
        });

        if (chat.length > 0) {
            return res.json(chat[0]);
        }

        // Create new chat
        const newChat = await Chat.create({
            chatName: "sender",
            isGroupChat: false,
            users: [req.user._id, userId],
        });

        const fullChat = await Chat.findById(newChat._id).populate(
            "users",
            "-password"
        );

        res.status(201).json(fullChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all chats for the logged-in user
// @route   GET /api/chats
const fetchChats = async (req, res) => {
    try {
        let chats = await Chat.find({
            users: { $elemMatch: { $eq: req.user._id } },
        })
            .populate("users", "-password")
            .populate("groupAdmin", "-password")
            .populate("latestMessage")
            .sort({ updatedAt: -1 });

        chats = await User.populate(chats, {
            path: "latestMessage.sender",
            select: "name email profilePicture",
        });

        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a group chat
// @route   POST /api/chats/group
const createGroupChat = async (req, res) => {
    const { name, users } = req.body;

    if (!name || !users || users.length < 2) {
        return res
            .status(400)
            .json({ message: "Please provide a name and at least 2 other users" });
    }

    try {
        const allUsers = [...users, req.user._id];

        const groupChat = await Chat.create({
            chatName: name,
            isGroupChat: true,
            users: allUsers,
            groupAdmin: req.user._id,
        });

        const fullGroupChat = await Chat.findById(groupChat._id)
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        res.status(201).json(fullGroupChat);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add user to group
// @route   PUT /api/chats/group/add
const addToGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $addToSet: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updated) {
            return res.status(404).json({ message: "Chat not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove user from group
// @route   PUT /api/chats/group/remove
const removeFromGroup = async (req, res) => {
    const { chatId, userId } = req.body;

    try {
        const updated = await Chat.findByIdAndUpdate(
            chatId,
            { $pull: { users: userId } },
            { new: true }
        )
            .populate("users", "-password")
            .populate("groupAdmin", "-password");

        if (!updated) {
            return res.status(404).json({ message: "Chat not found" });
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    accessChat,
    fetchChats,
    createGroupChat,
    addToGroup,
    removeFromGroup,
};
