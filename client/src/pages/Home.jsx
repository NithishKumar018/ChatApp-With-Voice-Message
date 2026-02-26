import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Home = () => {
    const { user, logout } = useAuth();
    const [isMobileOpen, setMobileOpen] = useState(false);

    return (
        <ChatProvider>
            <div className="h-screen flex flex-col bg-slate-950">
                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-xl border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <span className="text-white font-semibold text-sm hidden sm:inline">ChatApp</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
                                {user?.name?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-slate-300 text-sm hidden sm:inline">{user?.name}</span>
                        </div>
                        <button
                            onClick={logout}
                            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                            title="Logout"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
                    <ChatWindow onOpenSidebar={() => setMobileOpen(true)} />
                </div>
            </div>
        </ChatProvider>
    );
};

export default Home;
