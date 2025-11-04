import { NavLink } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Education from "../assets/icon/education.svg?react";
import UserIcon from "../assets/icon/user.svg?react";
import { Menu, X } from 'lucide-react'; 

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
    const handleNavigation = useCallback(() => {
        if (isSidebarOpen) { 
            setIsSidebarOpen(false);
        }
    }, [isSidebarOpen]);

    const Sidebar = useMemo(() => (
        <aside
            className={cn(
                "flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50 transition-transform duration-300 z-50",
                "fixed inset-y-0 left-0 shadow-2xl",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full" 
            )}
        >        
            <div className="flex justify-between items-center mb-6">
                <div className="text-lg font-semibold">SmartFAQ Admin</div>
                <button 
                    onClick={toggleSidebar} 
                    className="p-1 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    aria-label="Đóng Sidebar"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>
            
            <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={handleNavigation} 
                        className={({ isActive }) =>
                            cn(
                                "rounded-lg px-3.5 py-2 text-sm transition-colors duration-200",
                                isActive
                                    ? "bg-[#003087] text-white" 
                                    : "bg-transparent hover:bg-slate-400/20"
                            )
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    ), [isSidebarOpen, toggleSidebar, handleNavigation]);

    return (
        <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">

            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black/50" 
                    onClick={toggleSidebar} 
                />
            )}
            {Sidebar}

            <main className="flex-1 overflow-y-auto w-full">
                <header 
                    className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleSidebar} 
                                className="text-gray-600 hover:text-gray-800 transition-colors p-1"
                                aria-label={isSidebarOpen ? "Đóng menu" : "Mở menu"}
                            >
                                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>                           
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
                <div className="flex flex-col gap-6 mt-6">{children}</div>
            </main>
        </div>
    );
};

export default ShellLayout;