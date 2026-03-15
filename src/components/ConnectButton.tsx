'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { Wallet } from 'lucide-react'

export function ConnectButton() {
    const [mounted, setMounted] = useState(false)
    const { address, isConnected } = useAccount()
    const { connect, connectors } = useConnect()
    const { disconnect } = useDisconnect()

    useEffect(() => {
        setMounted(true)
    }, [])

    const injectedConnector = connectors.find((c) => c.id === 'injected' || c.id === 'metaMaskSDK')

    if (!mounted) {
        return (
            <button className="flex items-center gap-2 rounded-full bg-[#e85a4f] text-white px-4 py-2 text-sm font-medium opacity-50 cursor-default">
                <Wallet className="h-4 w-4" />
                Connect Wallet
            </button>
        )
    }

    if (isConnected) {
        return (
            <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 rounded-full bg-[#0a1510] border border-[#1e3d2f] px-4 py-2 text-sm font-medium hover:bg-[#1e3d2f]/30 transition"
            >
                <Wallet className="h-4 w-4 text-[#4ade80]" />
                {address?.slice(0, 6)}...{address?.slice(-4)}
            </button>
        )
    }

    return (
        <button
            onClick={() => injectedConnector && connect({ connector: injectedConnector })}
            className="flex items-center gap-2 rounded-full bg-[#e85a4f] text-white px-4 py-2 text-sm font-medium hover:bg-[#d94a3f] transition shadow-lg shadow-red-500/20"
        >
            <Wallet className="h-4 w-4" />
            Connect Wallet
        </button>
    )
}
