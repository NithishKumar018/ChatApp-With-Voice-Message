import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import MessageItem from "./MessageItem";
import VoiceRecorder from "./VoiceRecorder";
import API from "../utils/api";

const ChatWindow = ({ onOpenSidebar }) => {
    const { user } = useAuth();
    const {
        selectedChat,
        messages,
        sendMessage,
        onlineUsers,
        typingUsers,
        emitTyping,
        emitStopTyping,
        setSelectedChat,
    } = useChat();

    const [input, setInput] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle typing
    const handleInputChange = useCallback(
        (e) => {
            setInput(e.target.value);

            if (selectedChat) {
                emitTyping(selectedChat._id);

                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => {
                    emitStopTyping(selectedChat._id);
                }, 2000);
            }
        },
        [selectedChat, emitTyping, emitStopTyping]
    );

    // Send text message
    const handleSend = useCallback(
        (e) => {
            e.preventDefault();
            if (!input.trim()) return;

            sendMessage(input.trim());
            setInput("");

            if (selectedChat) {
                emitStopTyping(selectedChat._id);
            }
        },
        [input, sendMessage, selectedChat, emitStopTyping]
    );

    // File upload
    const handleFileUpload = useCallback(
        async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", file);

                const { data } = await API.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                let messageType = "file";
                if (file.type.startsWith("image/")) messageType = "image";

                await sendMessage("", messageType, data.fileUrl, data.fileName);
            } catch (err) {
                console.error("Upload failed:", err);
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        },
        [sendMessage]
    );

    // Voice message upload
    const handleVoiceSend = useCallback(
        async (blob) => {
            setIsUploading(true);
            try {
                const formData = new FormData();
                formData.append("file", blob, "voice-message.webm");

                const { data } = await API.post("/upload", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                await sendMessage("Voice message", "voice", data.fileUrl, "voice-message.webm");
            } catch (err) {
                console.error("Voice upload failed:", err);
            } finally {
                setIsUploading(false);
            }
        },
        [sendMessage]
    );

    const getChatName = () => {
        if (!selectedChat) return "";
        if (selectedChat.isGroupChat) return selectedChat.chatName;
        const otherUser = selectedChat.users?.find((u) => u._id !== user._id);
        return otherUser?.name || "Unknown";
    };

    const isOtherOnline = () => {
        if (!selectedChat || selectedChat.isGroupChat) return false;
        const otherUser = selectedChat.users?.find((u) => u._id !== user._id);
        return otherUser ? onlineUsers.includes(otherUser._id) : false;
    };

    const typingIndicator = selectedChat ? typingUsers[selectedChat._id] : null;

    // Empty state
    if (!selectedChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-950 text-slate-500">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-purple-400/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">Select a conversation</h3>
                <p className="text-sm text-slate-500">Choose from your existing chats or search for users</p>

                {/* Mobile: show sidebar button */}
                <button
                    onClick={onOpenSidebar}
                    className="md:hidden mt-6 px-6 py-2.5 bg-purple-600/20 text-purple-400 rounded-xl hover:bg-purple-600/30 transition-colors text-sm font-medium"
                >
                    Open Chats
                </button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-slate-950 h-full">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-white/5 bg-slate-900/80 backdrop-blur-xl flex items-center gap-3">
                {/* Mobile back button */}
                <button
                    onClick={onOpenSidebar}
                    className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm ${selectedChat.isGroupChat
                            ? "bg-gradient-to-br from-amber-500 to-orange-600"
                            : "bg-gradient-to-br from-violet-500 to-purple-600"
                        }`}>
                        {selectedChat.isGroupChat
                            ? selectedChat.chatName?.[0]?.toUpperCase()
                            : getChatName()?.[0]?.toUpperCase()}
                    </div>
                    {isOtherOnline() && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">{getChatName()}</h3>
                    <p className="text-xs text-slate-500">
                        {typingIndicator
                            ? <span className="text-purple-400">{typingIndicator} is typing...</span>
                            : selectedChat.isGroupChat
                                ? `${selectedChat.users?.length || 0} members`
                                : isOtherOnline()
                                    ? <span className="text-emerald-400">Online</span>
                                    : "Offline"}
                    </p>
                </div>

                {/* Close chat on mobile */}
                <button
                    onClick={() => setSelectedChat(null)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-white/5">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-600">
                        <p className="text-sm">No messages yet. Say hi! 👋</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageItem
                            key={msg._id}
                            message={msg}
                            isOwn={msg.sender?._id === user._id || msg.sender === user._id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typingIndicator && (
                <div className="px-4 py-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                        <span className="text-xs text-purple-400">{typingIndicator} is typing</span>
                    </div>
                </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-white/5 bg-slate-900/50">
                {isUploading && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-purple-400">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Uploading...
                    </div>
                )}

                <form onSubmit={handleSend} className="flex items-end gap-2">
                    {/* File upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20 transition-all shrink-0"
                        title="Attach file"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>

                    {/* Voice recorder */}
                    <VoiceRecorder onSend={handleVoiceSend} />

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            value={input}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30 transition-all"
                        />
                    </div>

                    {/* Send button */}
                    <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-purple-500/20"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;
