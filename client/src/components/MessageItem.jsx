import { useAuth } from "../context/AuthContext";

const MessageItem = ({ message, isOwn }) => {
    const formatTime = (dateStr) => {
        return new Date(dateStr).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderContent = () => {
        switch (message.messageType) {
            case "image":
                return (
                    <div>
                        <img
                            src={message.fileUrl}
                            alt="shared"
                            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(message.fileUrl, "_blank")}
                        />
                        {message.content && (
                            <p className="mt-2 text-sm">{message.content}</p>
                        )}
                    </div>
                );

            case "voice":
                return (
                    <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                            </svg>
                        </div>
                        <audio controls className="flex-1 h-8 [&::-webkit-media-controls-panel]:bg-transparent">
                            <source src={message.fileUrl} type="audio/webm" />
                        </audio>
                    </div>
                );

            case "file":
                return (
                    <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{message.fileName || "File"}</p>
                            <p className="text-xs opacity-60">Click to download</p>
                        </div>
                    </a>
                );

            default:
                return <p className="text-sm leading-relaxed">{message.content}</p>;
        }
    };

    // Seen status icons
    const renderStatus = () => {
        if (!isOwn) return null;
        const seenCount = message.seenBy?.length || 0;

        if (seenCount > 1) {
            // Seen by others
            return (
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
        }
        // Sent/delivered
        return (
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
        );
    };

    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3 px-4`}>
            <div className={`max-w-[75%] md:max-w-[60%]`}>
                {/* Sender name for group chats */}
                {!isOwn && message.sender && (
                    <p className="text-xs text-purple-400 font-medium mb-1 ml-1">
                        {message.sender.name}
                    </p>
                )}

                <div
                    className={`rounded-2xl px-4 py-2.5 ${isOwn
                            ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-br-md"
                            : "bg-white/5 border border-white/10 text-slate-200 rounded-bl-md"
                        }`}
                >
                    {renderContent()}
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] opacity-60">
                            {formatTime(message.createdAt)}
                        </span>
                        {renderStatus()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessageItem;
