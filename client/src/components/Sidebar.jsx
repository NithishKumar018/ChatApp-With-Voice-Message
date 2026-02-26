import { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const Sidebar = ({ isMobileOpen, setMobileOpen }) => {
    const { user } = useAuth();
    const {
        chats,
        fetchChats,
        selectChat,
        selectedChat,
        onlineUsers,
        notifications,
        setNotifications,
    } = useChat();

    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [groupSearch, setGroupSearch] = useState("");
    const [groupSearchResults, setGroupSearchResults] = useState([]);
    const [selectedGroupUsers, setSelectedGroupUsers] = useState([]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    // Search users
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (search.trim().length > 0) {
                try {
                    const { data } = await API.get(`/auth/users?search=${search}`);
                    setSearchResults(data);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    // Search for group members
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (groupSearch.trim().length > 0) {
                try {
                    const { data } = await API.get(`/auth/users?search=${groupSearch}`);
                    setGroupSearchResults(data);
                } catch (err) {
                    console.error(err);
                }
            } else {
                setGroupSearchResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [groupSearch]);

    // Access 1-on-1 chat
    const handleAccessChat = async (userId) => {
        try {
            const { data } = await API.post("/chats", { userId });
            if (!chats.find((c) => c._id === data._id)) {
                fetchChats();
            }
            selectChat(data);
            setSearch("");
            setSearchResults([]);
            setMobileOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    // Create group chat
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedGroupUsers.length < 2) return;
        try {
            const { data } = await API.post("/chats/group", {
                name: groupName,
                users: selectedGroupUsers.map((u) => u._id),
            });
            fetchChats();
            selectChat(data);
            setShowGroupModal(false);
            setGroupName("");
            setSelectedGroupUsers([]);
            setGroupSearch("");
            setMobileOpen(false);
        } catch (err) {
            console.error(err);
        }
    };

    const getChatName = (chat) => {
        if (chat.isGroupChat) return chat.chatName;
        const otherUser = chat.users?.find((u) => u._id !== user._id);
        return otherUser?.name || "Unknown";
    };

    const getChatAvatar = (chat) => {
        if (chat.isGroupChat) return chat.chatName?.[0]?.toUpperCase() || "G";
        const otherUser = chat.users?.find((u) => u._id !== user._id);
        return otherUser?.name?.[0]?.toUpperCase() || "?";
    };

    const isOnline = (chat) => {
        if (chat.isGroupChat) return false;
        const otherUser = chat.users?.find((u) => u._id !== user._id);
        return otherUser ? onlineUsers.includes(otherUser._id) : false;
    };

    const getUnreadCount = (chatId) => {
        return notifications.filter((n) => (n.chat._id || n.chat) === chatId).length;
    };

    return (
        <>
            {/* Mobile overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div
                className={`fixed md:relative z-40 md:z-auto h-full w-80 bg-slate-900/95 backdrop-blur-xl border-r border-white/5 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white">Chats</h2>
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="p-2 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                            title="New Group"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                        />
                    </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="border-b border-white/5 max-h-60 overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Search results</p>
                        {searchResults.map((u) => (
                            <button
                                key={u._id}
                                onClick={() => handleAccessChat(u._id)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                    {u.name?.[0]?.toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-white text-sm font-medium">{u.name}</p>
                                    <p className="text-slate-500 text-xs">{u.email}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-4">
                            <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p className="text-sm">No conversations yet</p>
                            <p className="text-xs mt-1">Search for users to start chatting</p>
                        </div>
                    ) : (
                        chats.map((chat) => {
                            const unread = getUnreadCount(chat._id);
                            return (
                                <button
                                    key={chat._id}
                                    onClick={() => {
                                        selectChat(chat);
                                        setMobileOpen(false);
                                        // Clear notifications for this chat
                                        setNotifications((prev) =>
                                            prev.filter((n) => (n.chat._id || n.chat) !== chat._id)
                                        );
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 transition-all hover:bg-white/5 ${selectedChat?._id === chat._id
                                            ? "bg-purple-600/10 border-l-2 border-purple-500"
                                            : "border-l-2 border-transparent"
                                        }`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm ${chat.isGroupChat
                                                ? "bg-gradient-to-br from-amber-500 to-orange-600"
                                                : "bg-gradient-to-br from-violet-500 to-purple-600"
                                            }`}>
                                            {getChatAvatar(chat)}
                                        </div>
                                        {isOnline(chat) && (
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="flex justify-between items-center">
                                            <p className="text-white text-sm font-medium truncate">
                                                {getChatName(chat)}
                                            </p>
                                            {chat.latestMessage && (
                                                <span className="text-xs text-slate-500 shrink-0 ml-2">
                                                    {new Date(chat.latestMessage.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-slate-500 text-xs truncate">
                                                {chat.latestMessage
                                                    ? chat.latestMessage.messageType === "text"
                                                        ? chat.latestMessage.content
                                                        : `📎 ${chat.latestMessage.messageType}`
                                                    : "Start a conversation"}
                                            </p>
                                            {unread > 0 && (
                                                <span className="ml-2 shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-600 text-white text-xs font-bold">
                                                    {unread}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Group Chat Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-bold text-white mb-4">Create Group Chat</h3>

                        <input
                            type="text"
                            placeholder="Group name"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-3 transition-all"
                        />

                        <input
                            type="text"
                            placeholder="Search users to add..."
                            value={groupSearch}
                            onChange={(e) => setGroupSearch(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 mb-3 transition-all"
                        />

                        {/* Selected users tags */}
                        {selectedGroupUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {selectedGroupUsers.map((u) => (
                                    <span
                                        key={u._id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-600/20 text-purple-300 text-xs rounded-full"
                                    >
                                        {u.name}
                                        <button
                                            onClick={() =>
                                                setSelectedGroupUsers((prev) =>
                                                    prev.filter((su) => su._id !== u._id)
                                                )
                                            }
                                            className="hover:text-red-400 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Search results for group */}
                        {groupSearchResults.length > 0 && (
                            <div className="max-h-40 overflow-y-auto border border-white/5 rounded-xl mb-4">
                                {groupSearchResults.map((u) => (
                                    <button
                                        key={u._id}
                                        onClick={() => {
                                            if (!selectedGroupUsers.find((su) => su._id === u._id)) {
                                                setSelectedGroupUsers((prev) => [...prev, u]);
                                            }
                                            setGroupSearch("");
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="text-white text-sm">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowGroupModal(false);
                                    setSelectedGroupUsers([]);
                                    setGroupName("");
                                    setGroupSearch("");
                                }}
                                className="flex-1 py-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-xl hover:bg-white/10 transition-colors text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName.trim() || selectedGroupUsers.length < 2}
                                className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold"
                            >
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Sidebar;
