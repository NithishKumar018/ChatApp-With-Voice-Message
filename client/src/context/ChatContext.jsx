import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import API from "../utils/api";

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

const SOCKET_URL = "http://localhost:5000";

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [typingUsers, setTypingUsers] = useState({});
    const [notifications, setNotifications] = useState([]);
    const socketRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.emit("setup", user._id);

        socket.on("online_users", (users) => setOnlineUsers(users));
        socket.on("user_online", ({ userId }) => {
            setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
        });
        socket.on("user_offline", ({ userId }) => {
            setOnlineUsers((prev) => prev.filter((id) => id !== userId));
        });

        socket.on("message_received", (newMsg) => {
            setMessages((prev) => {
                // Avoid duplicates
                if (prev.find((m) => m._id === newMsg._id)) return prev;
                return [...prev, newMsg];
            });

            // Update chats list
            setChats((prev) => {
                return prev.map((c) => {
                    if (c._id === newMsg.chat._id || c._id === newMsg.chat) {
                        return { ...c, latestMessage: newMsg };
                    }
                    return c;
                });
            });

            // Add notification if not in current chat
            setSelectedChat((currentChat) => {
                if (!currentChat || currentChat._id !== (newMsg.chat._id || newMsg.chat)) {
                    setNotifications((prev) => [...prev, newMsg]);
                }
                return currentChat;
            });
        });

        socket.on("typing", ({ chatId, userName }) => {
            setTypingUsers((prev) => ({ ...prev, [chatId]: userName }));
        });

        socket.on("stop_typing", ({ chatId }) => {
            setTypingUsers((prev) => {
                const updated = { ...prev };
                delete updated[chatId];
                return updated;
            });
        });

        socket.on("message_seen", ({ chatId }) => {
            setMessages((prev) =>
                prev.map((m) => {
                    if ((m.chat._id || m.chat) === chatId) {
                        return { ...m, seenBy: [...(m.seenBy || []), "seen"] };
                    }
                    return m;
                })
            );
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    // Fetch chats
    const fetchChats = useCallback(async () => {
        try {
            const { data } = await API.get("/chats");
            setChats(data);
        } catch (err) {
            console.error("Error fetching chats:", err);
        }
    }, []);

    // Select chat & fetch messages
    const selectChat = useCallback(
        async (chat) => {
            setSelectedChat(chat);
            if (socketRef.current) {
                socketRef.current.emit("join_chat", chat._id);
            }

            // Remove notifications for this chat
            setNotifications((prev) =>
                prev.filter((n) => (n.chat._id || n.chat) !== chat._id)
            );

            try {
                const { data } = await API.get(`/messages/${chat._id}`);
                setMessages(data);

                // Mark messages as seen
                await API.put(`/messages/seen/${chat._id}`);
                if (socketRef.current) {
                    socketRef.current.emit("message_seen", {
                        chatId: chat._id,
                        userId: user._id,
                    });
                }
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        },
        [user]
    );

    // Send message
    const sendMessage = useCallback(
        async (content, messageType = "text", fileUrl = "", fileName = "") => {
            if (!selectedChat) return;

            try {
                const { data } = await API.post("/messages", {
                    chatId: selectedChat._id,
                    content,
                    messageType,
                    fileUrl,
                    fileName,
                });

                setMessages((prev) => [...prev, data]);

                // Emit via socket
                if (socketRef.current) {
                    socketRef.current.emit("new_message", data);
                }

                // Update chat list
                setChats((prev) =>
                    prev.map((c) =>
                        c._id === selectedChat._id ? { ...c, latestMessage: data } : c
                    )
                );

                return data;
            } catch (err) {
                console.error("Error sending message:", err);
            }
        },
        [selectedChat]
    );

    // Typing
    const emitTyping = useCallback(
        (chatId) => {
            if (socketRef.current && user) {
                socketRef.current.emit("typing", {
                    chatId,
                    userId: user._id,
                    userName: user.name,
                });
            }
        },
        [user]
    );

    const emitStopTyping = useCallback(
        (chatId) => {
            if (socketRef.current && user) {
                socketRef.current.emit("stop_typing", {
                    chatId,
                    userId: user._id,
                });
            }
        },
        [user]
    );

    return (
        <ChatContext.Provider
            value={{
                chats,
                selectedChat,
                messages,
                onlineUsers,
                typingUsers,
                notifications,
                fetchChats,
                selectChat,
                sendMessage,
                setSelectedChat,
                emitTyping,
                emitStopTyping,
                setNotifications,
                socketRef,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
