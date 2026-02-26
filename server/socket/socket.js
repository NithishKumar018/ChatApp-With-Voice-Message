const User = require("../models/User");

const onlineUsers = new Map(); // userId -> socketId

const setupSocket = (io) => {
    io.on("connection", (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // User comes online
        socket.on("setup", async (userId) => {
            try {
                if (!userId) {
                    console.log("⚠️ Setup attempted without userId");
                    return;
                }
                socket.userId = userId;
                socket.join(userId);
                onlineUsers.set(userId, socket.id);

                // Update DB
                await User.findByIdAndUpdate(userId, {
                    onlineStatus: true,
                    lastSeen: new Date(),
                });

                // Broadcast online status to all
                io.emit("user_online", {
                    userId,
                    onlineStatus: true,
                });

                // Send current online users list to the connecting user
                const onlineUserIds = Array.from(onlineUsers.keys());
                socket.emit("online_users", onlineUserIds);
            } catch (error) {
                console.error("❌ Socket setup error:", error);
            }
        });

        // Join a specific chat room
        socket.on("join_chat", (chatId) => {
            socket.join(chatId);
        });

        // Leave a chat room
        socket.on("leave_chat", (chatId) => {
            socket.leave(chatId);
        });

        // New message
        socket.on("new_message", (message) => {
            const chat = message.chat;
            if (!chat || !chat.users) return;

            chat.users.forEach((user) => {
                if (user._id === message.sender._id) return;
                socket.in(user._id).emit("message_received", message);
            });
        });

        // Typing indicators
        socket.on("typing", ({ chatId, userId, userName }) => {
            socket.in(chatId).emit("typing", { chatId, userId, userName });
        });

        socket.on("stop_typing", ({ chatId, userId }) => {
            socket.in(chatId).emit("stop_typing", { chatId, userId });
        });

        // Message seen
        socket.on("message_seen", ({ chatId, userId }) => {
            socket.in(chatId).emit("message_seen", { chatId, userId });
        });

        // Disconnect
        socket.on("disconnect", async () => {
            try {
                console.log(`❌ Socket disconnected: ${socket.id}`);

                if (socket.userId) {
                    onlineUsers.delete(socket.userId);

                    await User.findByIdAndUpdate(socket.userId, {
                        onlineStatus: false,
                        lastSeen: new Date(),
                    });

                    io.emit("user_offline", {
                        userId: socket.userId,
                        onlineStatus: false,
                        lastSeen: new Date(),
                    });
                }
            } catch (error) {
                console.error("❌ Socket disconnect error:", error);
            }
        });
    });
};

module.exports = setupSocket;
