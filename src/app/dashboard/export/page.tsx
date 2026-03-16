'use client'

import { useState, useEffect } from 'react'
import { Download, Loader2, Check, AlertCircle } from 'lucide-react'
import apiClient, { APIResponse } from '@/lib/api-client'
import { fetchBotApi } from '@/lib/api'
import { generateCSV } from '@/lib/export-helpers'

// Types for available fields
type WebField = 'nombre_completo' | 'email' | 'telefono' | 'wallet_address' | 'edad' | 'fecha_nacimiento' | 'telegram_id' | 'created_at' | 'updated_at'
type BotField = 'first_name' | 'last_name' | 'username' | 'score' | 'walletAddress' | 'telegramId'

export default function ExportPage() {
    const [isLoadingStats, setIsLoadingStats] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const [stats, setStats] = useState({
        webTotal: 0,
        botTotal: 0
    })

    // Selected fields
    const [webFields, setWebFields] = useState<Record<WebField, boolean>>({
        telegram_id: true,
        nombre_completo: true,
        email: true,
        telefono: true,
        wallet_address: true,
        edad: false,
        fecha_nacimiento: false,
        created_at: false,
        updated_at: false,
    })

    const [botFields, setBotFields] = useState<Record<BotField, boolean>>({
        telegramId: true,
        first_name: true,
        last_name: true,
        username: true,
        score: true,
        walletAddress: false,
    })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        setIsLoadingStats(true)
        setError(null)
        try {
            // Fetch Web Users Total (using page 1 with limit 1 to just get pagination info)
            const webResponse = await apiClient.get<APIResponse<any>>('/users', {
                params: { page: 1, limit: 1 }
            })
            const webTotal = webResponse.data.pagination?.total_records || 0

            // Fetch Bot Users Total (using the new endpoint)
            let botTotal = 0
            try {
                const botResponse = await fetchBotApi('/users/count')
                botTotal = botResponse.count || 0
            } catch (botErr) {
                console.warn('Bot count endpoint failed. Might not be implemented yet on the server.', botErr)
            }

            setStats({ webTotal, botTotal })
        } catch (err: any) {
            console.error('Failed to load stats:', err)
            setError('Failed to load user statistics. You can still try to export.')
        } finally {
            setIsLoadingStats(false)
        }
    }

    const toggleWebField = (field: WebField) => {
        setWebFields(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const toggleBotField = (field: BotField) => {
        setBotFields(prev => ({ ...prev, [field]: !prev[field] }))
    }

    const handleExport = async () => {
        setIsExporting(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const result = await generateCSV(webFields, botFields)
            setSuccessMessage(`Successfully exported ${result.totalRows} users!`)
            setTimeout(() => setSuccessMessage(null), 5000)
        } catch (err: any) {
            console.error('Export failed:', err)
            setError(err.message || 'Failed to export data. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    const webFieldLabels: Record<WebField, string> = {
        telegram_id: 'Telegram ID (Match Key)',
        nombre_completo: 'Full Name',
        email: 'Email',
        telefono: 'Phone',
        wallet_address: 'Wallet Address',
        edad: 'Age',
        fecha_nacimiento: 'Date of Birth',
        created_at: 'Created At',
        updated_at: 'Updated At'
    }

    const botFieldLabels: Record<BotField, string> = {
        telegramId: 'Telegram ID (Match Key)',
        first_name: 'First Name',
        last_name: 'Last Name',
        username: 'Username',
        score: 'Game Score',
        walletAddress: 'Wallet Address (Bot)'
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-12">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Export Data</h1>
                <p className="text-zinc-400 mt-2">Export Web and Bot user data to CSV.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                    <h3 className="text-lg font-medium text-zinc-300">Total Web Users</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                        {isLoadingStats ? (
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{stats.webTotal.toLocaleString()}</span>
                        )}
                        <span className="text-sm text-zinc-500">registered users</span>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                    <h3 className="text-lg font-medium text-zinc-300">Total Bot Users</h3>
                    <div className="mt-4 flex items-baseline gap-2">
                        {isLoadingStats ? (
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{stats.botTotal.toLocaleString()}</span>
                        )}
                        <span className="text-sm text-zinc-500">active players</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3">
                    <Check className="w-5 h-5 shrink-0" />
                    <p>{successMessage}</p>
                </div>
            )}

            {/* Configuration */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                    <h2 className="text-xl font-semibold text-white">Select Fields to Export</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                        Choose which data columns to include in the generated CSV. Users will be matched by their Telegram ID where possible.
                    </p>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Web Fields */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-emerald-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Web App Data
                        </h3>
                        <div className="space-y-3">
                            {(Object.keys(webFields) as WebField[]).map(field => (
                                <label key={`web-${field}`} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${webFields[field]
                                        ? 'bg-emerald-500 border-emerald-500'
                                        : 'border-zinc-700 bg-zinc-950 group-hover:border-emerald-500/50'
                                        }`}>
                                        {webFields[field] && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={webFields[field]}
                                        onChange={() => toggleWebField(field)}
                                        disabled={field === 'telegram_id'}
                                    />
                                    <span className={`text-sm select-none ${field === 'telegram_id' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                                        {webFieldLabels[field]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Bot Fields */}
                    <div className="space-y-4">
                        <h3 className="font-medium text-blue-400 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Telegram Bot Data
                        </h3>
                        <div className="space-y-3">
                            {(Object.keys(botFields) as BotField[]).map(field => (
                                <label key={`bot-${field}`} className="flex items-center gap-3 cursor-pointer group">
                                    <div className={`w-5 h-5 flex items-center justify-center rounded border transition-colors ${botFields[field]
                                        ? 'bg-blue-500 border-blue-500'
                                        : 'border-zinc-700 bg-zinc-950 group-hover:border-blue-500/50'
                                        }`}>
                                        {botFields[field] && <Check className="w-3.5 h-3.5 text-zinc-950 stroke-[3]" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={botFields[field]}
                                        onChange={() => toggleBotField(field)}
                                        disabled={field === 'telegramId'}
                                    />
                                    <span className={`text-sm select-none ${field === 'telegramId' ? 'text-zinc-500 line-through' : 'text-zinc-300 group-hover:text-white'}`}>
                                        {botFieldLabels[field]}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-zinc-200 text-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold transition-colors shadow-lg shadow-white/5"
                    >
                        {isExporting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing Export...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Export as CSV
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
