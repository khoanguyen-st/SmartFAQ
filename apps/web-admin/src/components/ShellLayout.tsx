import  { useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { Menu, X } from 'lucide-react';
import Education from "../assets/icon/education.svg?react";
import UserIcon from "../assets/icon/user.svg?react";

interface NavItem {
    path: string;
    label: string;
}

const navItems: NavItem[] = [
    { path: "dashboard", label: "Dashboard" },
    { path: "logs", label: "Logs" },
    { path: "settings", label: "Settings" },
    { path: "uploaded", label: "Uploaded Documents" },
];

const ShellLayout = ({ children }: { children: ReactNode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

    return (
        <div className="flex h-screen overflow-hidden">

            <aside
                className={`
                    admin-shell__sidebar 
                    fixed top-0 left-0 h-full w-64 z-40 transition-transform duration-300
                    ${isSidebarOpen ? 'translate-x-0' : '!-translate-x-full'} 
                `}
            >
                <div className="absolute top-0 right-0 p-3">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-gray-700 bg-white rounded-full hover:bg-gray-100"
                        aria-label="Close Sidebar"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="admin-shell__logo pt-10">SmartFAQ Admin</div>
                <nav className="admin-shell__nav">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `admin-shell__nav-link${isActive ? " admin-shell__nav-link--active" : ""}`
                            }
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {isSidebarOpen && (
                <div
                    onClick={toggleSidebar}
                    className="fixed inset-0 bg-black opacity-50 z-30"
                ></div>
            )}

            <main className="admin-shell__content flex-1 overflow-y-auto">
                <header className="bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 flex items-center justify-center">
                                {!isSidebarOpen && (
                                    <button
                                        onClick={toggleSidebar}
                                        className="p-2 text-gray-700 rounded-md hover:bg-gray-100"
                                        aria-label="Open Sidebar"
                                    >
                                        <Menu className="h-6 w-6" />
                                    </button>
                                )}
                            </div>

                            <div className="w-10 h-10 bg-[#003087] rounded-lg flex items-center justify-center">
                                <Education />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-semibold text-gray-900">Greenwich SmartFAQ</h1>
                                <p className="text-sm text-gray-500">Document-based chatbot training system</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <UserIcon />
                            <span className="text-sm font-medium">BO User</span>
                        </div>
                    </div>
                </header>
                <div className="admin-shell__body">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default ShellLayout;