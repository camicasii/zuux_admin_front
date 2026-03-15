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
                <p className="text-[#9fb8a8]">Manage users interacting via the Telegram Mini App.</p>
            </div>

            <div className="bg-[#0a1510]/50 border border-[#1e3d2f] p-4 rounded-xl max-w-2xl">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2 text-white">
                    <KeyRound className="w-4 h-4 text-[#4ade80]" />
                    Authentication Required
                </h3>
                <p className="text-xs text-[#6b9b7f] mb-4">
                    To query the Telegram Bot API, you must provide a valid Telegram <code className="text-[#9fb8a8] bg-[#0f1f17] px-1 rounded">initData</code> string in the validation header.
                </p>
                <form onSubmit={handleAuthSubmit} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="query_id=xxx&user=%7B...%7D&hash=yyy"
                        value={validationHeader}
                        onChange={(e) => setValidationHeader(e.target.value)}
                        className="flex-1 bg-[#0f1f17] border border-[#1e3d2f] rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-[#4ade80] focus:border-[#4ade80] transition-colors text-white"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#e85a4f] hover:bg-[#d94a3f] text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-red-500/20"
                    >
                        Authenticate & Load
                    </button>
                </form>
            </div>

            <div className="bg-[#0a1510]/50 border border-[#1e3d2f] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[#9fb8a8] uppercase bg-[#0a1510]">
                            <tr>
                                <th className="px-6 py-4 font-medium">ID / Ref</th>
                                <th className="px-6 py-4 font-medium">Platform</th>
                                <th className="px-6 py-4 font-medium">Raw Data Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e3d2f]">
                            {loading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading Telegram users...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-[#e85a4f]">
                                        {error}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        No users found or pending authentication.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, i) => (
                                    <tr key={user.id || i} className="hover:bg-[#0a1510]/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.id || `User #${i}`}</td>
                                        <td className="px-6 py-4 text-[#9fb8a8]">{user.platform || 'Unknown'}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-[#6b9b7f] max-w-xs truncate">
                                            {user.raw || '{}'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {users.length > 0 && !loading && (
                    <div className="flex items-center justify-between px-6 py-4 bg-[#0a1510] border-t border-[#1e3d2f]">
                        <span className="text-sm text-[#9fb8a8]">
                            Showing offset <span className="font-semibold text-white">{skip}</span> to{' '}
                            <span className="font-semibold text-white">{skip + take}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSkip(s => Math.max(0, s - take))}
                                disabled={skip === 0}
                                className="px-3 py-1 text-sm rounded-lg bg-[#0a1510] text-[#9fb8a8] hover:bg-[#1e3d2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#1e3d2f]"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setSkip(skip + take)}
                                disabled={users.length < take} // simple check if less than 'take' returned, probably last page
                                className="px-3 py-1 text-sm rounded-lg bg-[#0a1510] text-[#9fb8a8] hover:bg-[#1e3d2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#1e3d2f]"
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
