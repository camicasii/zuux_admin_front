'use client'

import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { fetchBotApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface Campaign {
    id: number
    title: string
    description: string
    goal: number
    status: string
}

export default function BotCampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [loading, setLoading] = useState(true)

    const { logout } = useAuth()

    // Modal state
    const [isModalOpen, setModalOpen] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        goal: 0,
        status: 'active'
    })

    useEffect(() => {
        loadCampaigns()
    }, [])

    const loadCampaigns = async () => {
        try {
            setLoading(true)
            const data = await fetchBotApi('/campaigns/all')
            setCampaigns(data)
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to fetch campaigns.')
            if (err.message?.includes('403') || err.message?.includes('401')) {
                logout()
            }
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (campaign?: Campaign) => {
        if (campaign) {
            setEditingCampaign(campaign)
            setFormData({
                title: campaign.title || '',
                description: campaign.description || '',
                goal: campaign.goal || 0,
                status: campaign.status || 'active'
            })
        } else {
            setEditingCampaign(null)
            setFormData({
                title: '',
                description: '',
                goal: 0,
                status: 'active'
            })
        }
        setModalOpen(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // Enforce only one active campaign.
            // If creating a new campaign (which defaults to active usually) or editing to be 'active'
            const isSettingActive = !editingCampaign || formData.status === 'active'
            if (isSettingActive) {
                const activeCampaign = campaigns.find(c => c.status === 'active' && c.id !== editingCampaign?.id)
                if (activeCampaign) {
                    await fetchBotApi(`/campaigns/${activeCampaign.id}`, {
                        method: 'PUT',
                        body: JSON.stringify({
                            title: activeCampaign.title,
                            description: activeCampaign.description,
                            goal: activeCampaign.goal,
                            status: 'inactive'
                        })
                    })
                }
            }

            if (editingCampaign) {
                await fetchBotApi(`/campaigns/${editingCampaign.id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        goal: Number(formData.goal),
                        status: formData.status
                    })
                })
            } else {
                await fetchBotApi('/campaigns/create', {
                    method: 'POST',
                    body: JSON.stringify({
                        title: formData.title,
                        description: formData.description,
                        goal: Number(formData.goal)
                    })
                })
            }
            setModalOpen(false)
            loadCampaigns()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to save campaign.')
        }
    }

    const handleDelete = async (id: number, hard: boolean = false) => {
        try {
            await fetchBotApi(`/campaigns/${id}${hard ? '?hard=true' : ''}`, {
                method: 'DELETE'
            })
            loadCampaigns()
        } catch (err: any) {
            console.error(err)
            alert(err.message || 'Failed to delete campaign.')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bot Campaigns</h1>
                    <p className="text-[#9fb8a8]">Manage Telegram bot campaigns and their goals.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#e85a4f] hover:bg-[#d94a3f] text-white rounded-lg text-sm font-medium transition-opacity shadow-lg shadow-red-500/20"
                    >
                        <Plus className="w-4 h-4" /> Add Campaign
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="bg-[#0a1510]/40 rounded-xl border border-[#1e3d2f]/50 overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0a1510]/50 border-b border-[#1e3d2f]/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-[#9fb8a8]">ID</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#9fb8a8]">Campaign Info</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#9fb8a8] text-center">Goal</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#9fb8a8] text-center">Status</th>
                                <th className="px-6 py-4 text-sm font-semibold text-[#9fb8a8] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e3d2f]/30">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        Loading campaigns...
                                    </td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[#6b9b7f]">
                                        No campaigns found.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-[#0a1510]/20 transition-colors">
                                        <td className="px-6 py-4 text-[#9fb8a8] font-mono text-sm">
                                            #{campaign.id}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">
                                                {campaign.title}
                                            </div>
                                            <div className="text-sm text-[#6b9b7f] mt-1 max-w-sm truncate" title={campaign.description || ''}>
                                                {campaign.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-[#4ade80]">
                                                {campaign.goal}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${campaign.status === 'active'
                                                ? 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/20'
                                                : 'bg-[#e85a4f]/10 text-[#e85a4f] border-[#e85a4f]/20'
                                                }`}>
                                                {campaign.status || 'unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <div className="relative group">
                                                    <button
                                                        onClick={() => handleOpenModal(campaign)}
                                                        className="p-2 text-[#9fb8a8] hover:text-white hover:bg-[#0a1510] rounded-lg transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a1510] text-xs text-[#9fb8a8] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#1e3d2f]">
                                                        Edit Campaign
                                                    </div>
                                                </div>

                                                {campaign.status !== 'inactive' && campaign.status !== 'deleted' && (
                                                    <div className="relative group">
                                                        <button
                                                            onClick={() => handleDelete(campaign.id, false)}
                                                            className="p-2 text-yellow-500/70 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4 opacity-50" />
                                                        </button>
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-[#0a1510] text-xs text-[#9fb8a8] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#1e3d2f]">
                                                            Deactivate Campaign
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="relative group">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to PERMANENTLY delete this campaign?')) {
                                                                handleDelete(campaign.id, true)
                                                            }
                                                        }}
                                                        className="p-2 text-[#e85a4f]/70 hover:text-[#e85a4f] hover:bg-[#e85a4f]/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-[#0a1510] text-xs text-[#e85a4f] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-[#1e3d2f]">
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
                    <div className="bg-[#0a1510] border border-[#1e3d2f] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-[#1e3d2f]">
                            <h2 className="text-xl font-bold text-[#4ade80]">
                                {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                            </h2>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-[#6b9b7f] hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#9fb8a8] mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-[#0f1f17] border border-[#1e3d2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80] transition-colors"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-[#9fb8a8] mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full bg-[#0f1f17] border border-[#1e3d2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80] transition-colors resize-none"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#9fb8a8] mb-1">Goal</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full bg-[#0f1f17] border border-[#1e3d2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80] transition-colors"
                                        value={formData.goal}
                                        onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
                                    />
                                </div>
                                {editingCampaign && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#9fb8a8] mb-1">Status</label>
                                        <select
                                            className="w-full bg-[#0f1f17] border border-[#1e3d2f] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#4ade80] transition-colors appearance-none"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="completed">Completed</option>
                                            <option value="paused">Paused</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[#1e3d2f]">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
                                    className="px-5 py-2.5 rounded-lg font-medium border border-[#1e3d2f] text-[#9fb8a8] hover:bg-[#0a1510] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg font-medium bg-[#e85a4f] text-white hover:bg-[#d94a3f] shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Save Campaign
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
