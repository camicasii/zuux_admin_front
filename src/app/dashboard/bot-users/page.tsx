'use client'

import { useEffect, useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowDownUp, Copy, Check } from 'lucide-react'
import { fetchBotApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import apiClient, { APIResponse } from '@/lib/api-client'

interface User {
    id: number
    telegramId: string
    first_name: string
    last_name: string
    username: string
    gamePLay?: {
        score: number
    }
    walletAddress?: string
    wallet?: string // In case it's named wallet
}

export default function BotUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [skip, setSkip] = useState(0)
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
    const [isCopying, setIsCopying] = useState(false)
    const take = 10

    const { logout } = useAuth()

    useEffect(() => {
        loadUsers()
    }, [skip, sortOrder])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const whereFilter = searchTerm ? {
                OR: [
                    { username: { contains: searchTerm } },
                    { first_name: { contains: searchTerm } }
                ]
            } : undefined

            const orderBy = {
                gamePLay: { score: sortOrder }
            }

            const queryParams = new URLSearchParams({
                skip: skip.toString(),
                take: take.toString()
            })
            if (whereFilter) queryParams.append('where', JSON.stringify(whereFilter))
            queryParams.append('orderBy', JSON.stringify(orderBy))

            const data: User[] = await fetchBotApi(`/users/all?${queryParams.toString()}`)

            // Fetch wallet addresses using batch endpoint (more efficient)
            const usersToFetch = data.filter(u => !u.walletAddress && !u.wallet && u.telegramId);
            const walletMap = new Map<string, string>();

            if (usersToFetch.length > 0) {
                try {
                    const telegramIds = usersToFetch.map(u => String(u.telegramId));
                    const response = await apiClient.post<APIResponse<any>>('/users/wallets/batch', {
                        telegram_ids: telegramIds
                    });

                    if (response.data.success && response.data.data) {
                        response.data.data.forEach((item: any) => {
                            if (item.wallet_address) {
                                walletMap.set(String(item.telegram_id), item.wallet_address);
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch wallets batch:', e);
                    // Continue with wallets we have
                }
            }

            const usersWithWallets = data.map(user => {
                const telegramIdStr = String(user.telegramId);
                if (walletMap.has(telegramIdStr)) {
                    return { ...user, walletAddress: walletMap.get(telegramIdStr) };
                }
                return user;
            });

            setUsers(usersWithWallets)
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to fetch users. Permissions might be denied.')
            if (err.message?.includes('403') || err.message?.includes('401')) {
                logout()
            }
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setSkip(0)
        loadUsers()
    }

    const toggleSortOrder = () => {
        setSkip(0)
        setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
    }

    const handleCopyWallets = async () => {
        try {
            setIsCopying(true)
            const whereFilter = searchTerm ? {
                OR: [
                    { username: { contains: searchTerm } },
                    { first_name: { contains: searchTerm } }
                ]
            } : undefined

            const orderBy = { gamePLay: { score: sortOrder } }

            const queryParams = new URLSearchParams({
                skip: '0',
                take: '100'
            })
            if (whereFilter) queryParams.append('where', JSON.stringify(whereFilter))
            queryParams.append('orderBy', JSON.stringify(orderBy))

            const data: User[] = await fetchBotApi(`/users/all?${queryParams.toString()}`)

            // Extract telegram IDs for users without wallets
            const usersToFetch = data.filter(u => !u.walletAddress && !u.wallet && u.telegramId);
            const walletMap = new Map<string, string>();

            // Add existing wallets to map
            data.forEach(user => {
                if ((user.walletAddress || user.wallet) && user.telegramId) {
                    walletMap.set(String(user.telegramId), user.walletAddress || user.wallet!);
                }
            });

            // Fetch missing wallets using batch endpoint (1 request instead of N requests)
            if (usersToFetch.length > 0) {
                try {
                    const telegramIds = usersToFetch.map(u => String(u.telegramId));
                    const response = await apiClient.post<APIResponse<any>>('/users/wallets/batch', {
                        telegram_ids: telegramIds
                    });

                    if (response.data.success && response.data.data) {
                        response.data.data.forEach((item: any) => {
                            if (item.wallet_address) {
                                walletMap.set(item.telegram_id, item.wallet_address);
                            }
                        });
                    }
                } catch (e) {
                    console.error('Failed to fetch wallets batch:', e);
                    // Continue with wallets we already have
                }
            }

            const wallets = Array.from(walletMap.values());

            if (wallets.length === 0) {
                alert('No wallet addresses found in the top 100 results.')
                return
            }

            const textToCopy = wallets.join('\n')
            await navigator.clipboard.writeText(textToCopy)

            // Show check temporarily
            setTimeout(() => setIsCopying(false), 2000)
        } catch (err: any) {
            console.error('Copy failed:', err)
            alert('Failed to fetch and copy wallets.')
            setIsCopying(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bot Users</h1>
                    <p className="text-zinc-400">Manage Telegram bot users and scores.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCopyWallets}
                        disabled={isCopying}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                    >
                        {isCopying ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {isCopying ? 'Copied!' : 'Copy Top 100'}
                    </button>
                    <button
                        onClick={logout}
                        className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-sm font-medium transition-colors text-zinc-300"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <form onSubmit={handleSearch} className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by username or name..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
                    >
                        Search
                    </button>
                    <button
                        type="button"
                        onClick={toggleSortOrder}
                        className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors border border-zinc-700"
                        title="Sort by score"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                        <span className="hidden sm:inline">Score {sortOrder === 'desc' ? '(High to Low)' : '(Low to High)'}</span>
                    </button>
                </form>
            </div>

            {/* Results Table */}
            <div className="bg-zinc-900/40 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Telegram ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">User Details</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Wallet</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Points</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                        Loading users...
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                                            {user.telegramId ? user.telegramId.toString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">
                                                {user.first_name} {user.last_name}
                                            </div>
                                            <div className="text-sm text-zinc-500">
                                                @{user.username || 'unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-400 text-sm">
                                            {user.walletAddress || user.wallet || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-sm">
                                                {user.gamePLay?.score || 0} pts
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-zinc-900/20">
                    <button
                        onClick={() => setSkip(Math.max(0, skip - take))}
                        disabled={skip === 0 || loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-zinc-500">
                        Showing {skip + 1} to {skip + users.length}
                    </span>
                    <button
                        onClick={() => setSkip(skip + take)}
                        disabled={users.length < take || loading}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
