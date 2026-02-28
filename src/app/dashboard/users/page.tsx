'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Fallback to local 8080 if environment variable is not defined
const API_BASE_URL = process.env.NEXT_PUBLIC_WEB_API_URL || 'http://localhost:8080/api/v1'

interface User {
    id?: string
    nombre_completo: string
    email: string
    telefono: string
    fecha_nacimiento: string
    wallet_address?: string
    created_at?: string
}

interface Pagination {
    current_page: number
    per_page: number
    total_pages: number
    total_records: number
    has_next: boolean
    has_prev: boolean
}

export default function WebUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<Pagination | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchUsers = async (pageNumber: number, search: string = '') => {
        setLoading(true)
        setError('')
        try {
            let endpoint = `${API_BASE_URL}/users?page=${pageNumber}&limit=10&sort_by=created_at&order=desc`

            if (search.length >= 2) {
                endpoint = `${API_BASE_URL}/users/search?q=${encodeURIComponent(search)}&limit=20`
            }

            const res = await fetch(endpoint)
            const json = await res.json()

            if (!res.ok || json.success === false) {
                throw new Error(json.error?.message || 'Failed to fetch users')
            }

            setUsers(json.data || [])
            setPagination(json.pagination || null)
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Handle pagination changes
    useEffect(() => {
        fetchUsers(page, searchQuery)
    }, [page])

    // Handle search dynamically with a small delay or on enter. For simplicity we use a search button or simple string change > 2.
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        setPage(1) // Reset to first page
        fetchUsers(1, searchQuery)
    }

    return (
        <div className="space-y-6 mt-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Web Registered Users</h1>
                <p className="text-zinc-400">Manage users registered via the standard backend API.</p>
            </div>

            <div className="flex items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                    />
                </form>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-zinc-400 uppercase bg-zinc-900">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Phone</th>
                                <th className="px-6 py-4 font-medium">Wallet Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-rose-400">
                                        {error}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, i) => (
                                    <tr key={user.id || i} className="hover:bg-zinc-800/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.nombre_completo}</td>
                                        <td className="px-6 py-4 text-zinc-400">{user.email}</td>
                                        <td className="px-6 py-4 text-zinc-400">{user.telefono}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-400/80">{user.wallet_address || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && pagination && !searchQuery && (
                    <div className="flex items-center justify-between px-6 py-4 bg-zinc-900 border-t border-zinc-800">
                        <span className="text-sm text-zinc-400">
                            Showing page <span className="font-semibold text-white">{pagination.current_page}</span> of{' '}
                            <span className="font-semibold text-white">{pagination.total_pages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!pagination.has_prev}
                                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!pagination.has_next}
                                className="p-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
