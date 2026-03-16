'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAccount } from 'wagmi'
import { Wallet } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isSigningIn, mounted, login } = useAuth()
    const { isConnected } = useAccount()

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
                        {!mounted
                            ? 'Loading wallet state...'
                            : isConnected
                                ? 'Wallet connected! Sign a message to access the dashboard.'
                                : 'Please connect your wallet using the button in the top right to continue.'}
                    </p>

                    <button
                        onClick={login}
                        disabled={!mounted || !isConnected || isSigningIn}
                        className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold rounded-lg px-4 py-3 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSigningIn ? 'Awaiting Signature...' : 'Sign In with Wallet'}
                    </button>
                </div>
            </div>
        )
    }

    return <>{children}</>
}
