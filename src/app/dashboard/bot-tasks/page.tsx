'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, LogIn, X, Wallet } from 'lucide-react'
import { fetchBotApi } from '@/lib/api'
import { useAccount, useSignMessage } from 'wagmi'

interface Task {
    id: number
    title: string
    description: string
    url: string
    points: number
    status: string
}

export default function BotTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    // Wagmi hooks
    const { address, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const [isSigningIn, setIsSigningIn] = useState(false)

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        url: '',
        points: 0,
        status: 'active'
    })

    useEffect(() => {
        const token = localStorage.getItem('botAdminToken')
        if (token) {
            setIsAuthenticated(true)
        } else {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isAuthenticated) {
            loadTasks()
        }
    }, [isAuthenticated])

    const handleLoginWithWallet = async () => {
        if (!address) {
            alert("Please connect your wallet first using the top right button.")
            return
        }

        try {
            setIsSigningIn(true)

            // 1. Fetch nonce from backend
            const { nonce } = await fetchBotApi('/auth/nonce')

            // 2. Sign message with wallet
            const message = `Sign this message to prove you own this wallet.\nNonce: ${nonce}`
            const signature = await signMessageAsync({ message })

            // 3. Send signature and address to backend for verification
            const { token } = await fetchBotApi('/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ address, signature, nonce, message })
            })

            // 4. Store JWT and set authenticated state
            localStorage.setItem('botAdminToken', `Bearer ${token}`)
            setIsAuthenticated(true)

        } catch (err: any) {
            console.error('Login failed:', err)
            alert(err.message || 'Signature verification failed or wallet not authorized.')
        } finally {
            setIsSigningIn(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('botAdminToken')
        setIsAuthenticated(false)
        setTasks([])
    }

    const loadTasks = async () => {
        try {
            setLoading(true)
            const data = await fetchBotApi('/task/all')
            setTasks(data)
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to fetch tasks.')
            if (err.message?.includes('403') || err.message?.includes('401')) {
                handleLogout()
            }
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (task?: Task) => {
        if (task) {
            setEditingTask(task)
            setFormData({
                title: task.title || '',
                description: task.description || '',
                url: task.url || '',
                points: task.points || 0,
                status: task.status || 'active'
            })
        } else {
            setEditingTask(null)
            setFormData({
                title: '',
                description: '',
                url: '',
                points: 0,
                status: 'active'
            })
        }
        setModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingTask) {
                await fetchBotApi(`/task/${editingTask.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        ...formData,
                        points: Number(formData.points)
                    })
                })
            } else {
                await fetchBotApi('/task/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        ...formData,
                        points: Number(formData.points)
                    })
                })
            }
            setModalOpen(false)
            loadTasks()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to save task.')
        }
    }

    const handleDelete = async (id: number, hard: boolean = false) => {
        try {
            await fetchBotApi(`/task/${id}${hard ? '?hard=true' : ''}`, {
                method: 'DELETE'
            })
            loadTasks()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to delete task.')
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="bg-zinc-900/50 p-8 rounded-2xl border border-white/10 w-full max-w-md backdrop-blur-md">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-emerald-500/10 rounded-full text-emerald-400">
                            <Wallet className="w-8 h-8" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center mb-2">Admin Dashboard</h2>
                    <p className="text-zinc-400 text-center mb-6">
                        {isConnected
                            ? "Wallet connected! Sign a message to access the dashboard."
                            : "Please connect your wallet using the button in the top right to continue."}
                    </p>

                    <button
                        onClick={handleLoginWithWallet}
                        disabled={!isConnected || isSigningIn}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSigningIn ? 'Awaiting Signature...' : 'Sign In with Wallet'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bot Tasks</h1>
                    <p className="text-zinc-400">Manage Telegram bot game tasks.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-lg text-sm font-medium transition-colors text-zinc-300"
                    >
                        Logout API
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90 text-white rounded-lg text-sm font-medium transition-opacity shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Task
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-zinc-900/40 rounded-xl border border-white/5 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-zinc-900/50 border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400">Task Info</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-center">Points</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-center">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        Loading tasks...
                                    </td>
                                </tr>
                            ) : tasks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No tasks found.
                                    </td>
                                </tr>
                            ) : (
                                tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-zinc-800/20 transition-colors">
                                        <td className="px-6 py-4 text-zinc-400 font-mono text-sm">
                                            #{task.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">
                                                {task.title}
                                            </div>
                                            <div className="text-sm text-zinc-500 mt-1 max-w-sm truncate" title={task.url || ''}>
                                                {task.url || 'No URL'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-emerald-400">
                                                {task.points}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${task.status === 'active'
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {task.status || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="relative group">
                                                    <button
                                                        onClick={() => handleOpenModal(task)}
                                                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                        Edit Task
                                                    </div>
                                                </div>

                                                {task.status !== 'deleted' && (
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => handleDelete(task.id, false)}
                                                            className="p-2 text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 opacity-50" />
                                                        </button>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                            Deactivate Task
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="relative group">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to PERMANENTLY delete this task?')) {
                                                                handleDelete(task.id, true)
                                                            }
                                                        }}
                                                        className="p-2 text-red-500/70 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-zinc-800 text-xs text-rose-300 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                                        Permanent Delete
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-white/5">
                            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">
                                {editingTask ? 'Edit Task' : 'Create Task'}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-1">URL (Action Link)</label>
                                <input
                                    type="url"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Points</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                        value={formData.points}
                                        onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
                                    <select
                                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="deleted">Deleted</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg font-medium border border-zinc-800 text-zinc-300 hover:bg-zinc-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    Save Task
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
