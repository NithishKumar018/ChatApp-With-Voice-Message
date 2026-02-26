const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
        content: { type: String, default: "" },
        messageType: {
            type: String,
            enum: ["text", "image", "voice", "file"],
            default: "text",
        },
        fileUrl: { type: String, default: "" },
        fileName: { type: String, default: "" },
        seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
