'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send, Users, MessageSquare } from 'lucide-react'

export function Sidebar() {
    const pathname = usePathname()

    const links = [
        { name: 'Batch Transfer', href: '/', icon: Send },
        { name: 'Web Users', href: '/dashboard/users', icon: Users },
        { name: 'Telegram Users', href: '/dashboard/telegram', icon: MessageSquare },
    ]

    return (
        <div className="w-64 flex flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-md h-screen fixed left-0 top-16 pt-6 z-40 hidden md:flex">
            <nav className="flex flex-col gap-2 px-4">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href

                    return (
                        <Link
                            key={link.name}
                            href={link.href}
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
    )
}
