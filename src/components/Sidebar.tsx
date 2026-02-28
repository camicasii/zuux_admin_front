'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send, Users, MessageSquare, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const links = [
        { name: 'Batch Transfer', href: '/', icon: Send },
        { name: 'Web Users', href: '/dashboard/users', icon: Users },
        { name: 'Telegram Users', href: '/dashboard/telegram', icon: MessageSquare },
        { name: 'Bot Users', href: '/dashboard/bot-users', icon: Users },
        { name: 'Bot Tasks', href: '/dashboard/bot-tasks', icon: MessageSquare },
    ]

    return (
        <>
            {/* Mobile Toggle Button (Visible only on mobile) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed top-3 left-4 z-[60] p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white"
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
                flex flex-col border-r border-white/5 bg-zinc-950/95 backdrop-blur-md h-screen fixed left-0 top-0 pt-20 z-50 
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
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {link.name}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </>
    )
}
