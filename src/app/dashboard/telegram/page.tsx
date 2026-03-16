'use client'

import { useState, useEffect } from 'react'
import { Loader2, KeyRound } from 'lucide-react'

// Fallback to local 4000 if environment variable is not defined
const TELEGRAM_API_URL = process.env.NEXT_PUBLIC_TELEGRAM_API_URL || 'http://localhost:4000'

interface TelegramUser {
    id?: string
    raw?: string
    platform?: string
    // Extend based on the actual User model from telegram bot backend
    createdAt?: string
}

export default function TelegramUsersPage() {
    const [users, setUsers] = useState<TelegramUser[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [validationHeader, setValidationHeader] = useState('')
    const [skip, setSkip] = useState(0)
    const take = 10

    const fetchUsers = async () => {
        if (!validationHeader) {
            setError('A Validation Header (Telegram initData) is required to fetch these users.')
            return
        }

        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${TELEGRAM_API_URL}/users/all?skip=${skip}&take=${take}`, {
                headers: {
                    'validation': validationHeader
                }
            })

            if (!res.ok) {
                throw new Error(`Error ${res.status}: Failed to fetch Telegram users`)
            }

            const data = await res.json()
            setUsers(Array.isArray(data) ? data : (data.data || []))
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (validationHeader) {
            fetchUsers()
        }
    }, [skip])

    const handleAuthSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setSkip(0)
        fetchUsers()
    }

    return (
        <div className="space-y-6 mt-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Telegram Bot Users</h1>
                <p className="text-zinc-400">Manage users interacting via the Telegram Mini App.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl max-w-2xl">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    Authentication Required
                </h3>
                <p className="text-xs text-zinc-500 mb-4">
                    To query the Telegram Bot API, you must provide a valid Telegram <code className="text-zinc-300 bg-zinc-800 px-1 rounded">initData</code> string in the validation header.
                </p>
                <form onSubmit={handleAuthSubmit} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="query_id=xxx&user=%7B...%7D&hash=yyy"
                        value={validationHeader}
                        onChange={(e) => setValidationHeader(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-sm font-medium rounded-lg transition-colors"
                    >
                        Authenticate & Load
                    </button>
                </form>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID / Ref</th>
                                <th className="px-6 py-4 font-medium">Platform</th>
                                <th className="px-6 py-4 font-medium">Raw Data Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading Telegram users...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-rose-400">
                                        {error}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-zinc-500">
                                        No users found or pending authentication.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, i) => (
                                    <tr key={user.id || i} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.id || `User #${i}`}</td>
                                        <td className="px-6 py-4 text-zinc-400">{user.platform || 'Unknown'}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-zinc-500 max-w-xs truncate">
                                            {user.raw || '{}'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {users.length > 0 && !loading && (
                    <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-t border-zinc-800">
                        <span className="text-sm text-zinc-400">
                            Showing offset <span className="font-semibold text-white">{skip}</span> to{' '}
                            <span className="font-semibold text-white">{skip + take}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSkip(s => Math.max(0, s - take))}
                                disabled={skip === 0}
                                className="px-3 py-1 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setSkip(skip + take)}
                                disabled={users.length < take} // simple check if less than 'take' returned, probably last page
                                className="px-3 py-1 text-sm rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
