'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send, Users, MessageSquare, Menu, X, LogOut, Download } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function Sidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const { isAuthenticated, logout } = useAuth()

    const links = [
        { name: 'Batch Transfer', href: '/', icon: Send },
        { name: 'Web Users', href: '/dashboard/users', icon: Users },
        { name: 'Telegram Users', href: '/dashboard/telegram', icon: MessageSquare },
        { name: 'Bot Users', href: '/dashboard/bot-users', icon: Users },
        { name: 'Bot Tasks', href: '/dashboard/bot-tasks', icon: MessageSquare },
        { name: 'Bot Campaigns', href: '/dashboard/bot-campaigns', icon: MessageSquare },
        { name: 'Export', href: '/dashboard/export', icon: Download },
    ]

    return (
        <>
            {/* Mobile Toggle Button (Visible only on mobile) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-3 left-4 z-[60] p-2 bg-[#0a1510] border border-[#1e3d2f] rounded-lg text-[#9fb8a8] hover:text-white"
            >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Backdrop for Mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar container */}
            <div className={`
                flex flex-col border-r border-[#1e3d2f]/50 bg-[#0f1f17]/95 backdrop-blur-md h-screen fixed left-0 top-0 pt-20 z-50 
                w-64 transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <nav className="flex flex-col gap-2 px-4">
                    {links.map((link) => {
                        const Icon = link.icon
                        const isActive = pathname === link.href

                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                onClick={() => setIsOpen(false)} // close on mobile after click
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${isActive
                                    ? 'bg-[#4ade80]/10 text-[#4ade80] border border-[#4ade80]/20'
                                    : 'text-[#9fb8a8] hover:bg-[#0a1510] hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>

                {isAuthenticated && (
                    <div className="mt-auto px-4 pb-6">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[#9fb8a8] hover:bg-[#0a1510] hover:text-white transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </>
    )
}
