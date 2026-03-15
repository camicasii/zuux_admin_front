'use client'

import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight, Loader2, Eye, X } from 'lucide-react'
import apiClient, { APIResponse, PaginationData } from '@/lib/api-client'
import { useApiError } from '@/hooks/useApiError'

interface User {
    id?: string
    nombre_completo: string
    email: string
    telefono: string
    fecha_nacimiento: string
    edad?: number
    redes_sociales?: Record<string, string>
    telegram_id?: string
    wallet_address?: string
    created_at?: string
    updated_at?: string
}

export default function WebUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [pagination, setPagination] = useState<PaginationData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const { getErrorMessage } = useApiError()

    const fetchUsers = async (pageNumber: number, search: string = '') => {
        setLoading(true)
        setError('')
        try {
            if (search.length >= 2) {
                const response = await apiClient.get<APIResponse<User[]>>('/users/search', {
                    params: { q: search, limit: 20 }
                })
                if (response.data.success) {
                    setUsers(response.data.data || [])
                    setPagination(null)
                }
            } else {
                const response = await apiClient.get<APIResponse<User[]>>('/users', {
                    params: { page: pageNumber, limit: 10, sort_by: 'created_at', order: 'desc' }
                })
                if (response.data.success) {
                    setUsers(response.data.data || [])
                    setPagination(response.data.pagination || null)
                }
            }
        } catch (err: any) {
            console.error(err)
            setError(getErrorMessage(err))
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
                <p className="text-[#9fb8a8]">Manage users registered via the standard backend API.</p>
            </div>

            <div className="flex items-center justify-between">
                <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b9b7f]" />
                    <input
                        type="text"
                        placeholder="Search users by name, email, or wallet..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-[#0a1510] border border-[#1e3d2f] rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-[#4ade80] focus:border-[#4ade80] transition-colors text-white"
                    />
                </form>
            </div>

            <div className="bg-[#0a1510]/50 border border-[#1e3d2f] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[#9fb8a8] uppercase bg-[#0a1510]">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Phone</th>
                                <th className="px-6 py-4 font-medium">Wallet Address</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e3d2f]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading users...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#e85a4f]">
                                        {error}
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                users.map((user, i) => (
                                    <tr key={user.id || i} className="hover:bg-[#0a1510]/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-white">{user.nombre_completo}</td>
                                        <td className="px-6 py-4 text-[#9fb8a8]">{user.email}</td>
                                        <td className="px-6 py-4 text-[#9fb8a8]">{user.telefono}</td>
                                        <td className="px-6 py-4 font-mono text-[#4ade80]/80">{user.wallet_address || 'N/A'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedUser(user)}
                                                className="p-2 bg-[#0a1510] hover:bg-[#1e3d2f] text-[#9fb8a8] rounded-lg transition-colors border border-[#1e3d2f]"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {!loading && pagination && !searchQuery && (
                    <div className="flex items-center justify-between px-6 py-4 bg-[#0a1510] border-t border-[#1e3d2f]">
                        <span className="text-sm text-[#9fb8a8]">
                            Showing page <span className="font-semibold text-white">{pagination.current_page}</span> of{' '}
                            <span className="font-semibold text-white">{pagination.total_pages}</span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={!pagination.has_prev}
                                className="p-2 rounded-lg bg-[#0a1510] text-[#9fb8a8] hover:bg-[#1e3d2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#1e3d2f]"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={!pagination.has_next}
                                className="p-2 rounded-lg bg-[#0a1510] text-[#9fb8a8] hover:bg-[#1e3d2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-[#1e3d2f]"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* User Details Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a1510] border border-[#1e3d2f] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="bg-[#0a1510] border-b border-[#1e3d2f] p-5 flex items-center justify-between z-10 shrink-0">
                            <h2 className="text-xl font-semibold text-white">User Details</h2>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 text-[#9fb8a8] hover:text-white hover:bg-[#1e3d2f] rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-8 flex-1">
                            {/* Basic Info */}
                            <div>
                                <h3 className="text-sm font-medium text-[#6b9b7f] uppercase mb-4 tracking-wider">Basic Information</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Full Name</div>
                                        <div className="font-medium text-white">{selectedUser.nombre_completo}</div>
                                    </div>
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Email</div>
                                        <div className="text-[#9fb8a8]">{selectedUser.email}</div>
                                    </div>
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Phone</div>
                                        <div className="text-[#9fb8a8]">{selectedUser.telefono || 'N/A'}</div>
                                    </div>
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Date of Birth</div>
                                        <div className="text-[#9fb8a8]">{selectedUser.fecha_nacimiento ? new Date(selectedUser.fecha_nacimiento).toLocaleDateString() : 'N/A'} {selectedUser.edad ? `(${selectedUser.edad} years)` : ''}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div>
                                <h3 className="text-sm font-medium text-[#6b9b7f] uppercase mb-4 tracking-wider">Identifiers</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Telegram ID</div>
                                        <div className="font-mono text-[#9fb8a8] text-sm overflow-hidden text-ellipsis">{selectedUser.telegram_id || 'N/A'}</div>
                                    </div>
                                    <div className="bg-[#0f1f17] p-4 rounded-xl border border-[#1e3d2f]/50">
                                        <div className="text-xs text-[#6b9b7f] mb-1">Wallet Address</div>
                                        <div className="font-mono text-[#4ade80]/80 text-sm overflow-hidden text-ellipsis">{selectedUser.wallet_address || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Networks */}
                            <div>
                                <h3 className="text-sm font-medium text-[#6b9b7f] uppercase mb-4 tracking-wider">Social Networks</h3>
                                {selectedUser.redes_sociales && Object.keys(selectedUser.redes_sociales).length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(selectedUser.redes_sociales).map(([network, handle]) => (
                                            <div key={network} className="flex items-center gap-3 bg-[#0f1f17]/50 border border-[#1e3d2f]/50 p-3 rounded-xl">
                                                <div className="capitalize font-medium text-[#9fb8a8] w-24 shrink-0">{network}</div>
                                                <div className="text-[#4ade80] hover:text-[#22c55e] transition-colors truncate text-sm">
                                                    <a href={handle.startsWith('http') ? handle : `https://${network}.com/${handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer">
                                                        {handle}
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-[#6b9b7f] bg-[#0f1f17]/50 border border-dashed border-[#1e3d2f] rounded-xl p-8 text-center text-sm">
                                        No social networks registered for this user.
                                    </div>
                                )}
                            </div>

                            {/* Timestamps */}
                            <div className="border-t border-[#1e3d2f] pt-6 flex flex-col sm:flex-row gap-4 sm:justify-between text-xs text-[#6b9b7f]">
                                <div>Created: {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleString() : 'N/A'}</div>
                                <div>Last Updated: {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
