'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { fetchBotApi } from '@/lib/api'

interface AuthContextType {
    isAuthenticated: boolean
    isSigningIn: boolean
    mounted: boolean
    login: () => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [mounted, setMounted] = useState(false)

    const { address } = useAccount()
    const { signMessageAsync } = useSignMessage()

    useEffect(() => {
        setMounted(true)
        const token = localStorage.getItem('botAdminToken')
        if (token) {
            setIsAuthenticated(true)
        }
    }, [])

    const login = async () => {
        if (!address) {
            alert('Please connect your wallet first using the top right button.')
            return
        }

        try {
            setIsSigningIn(true)

            const { nonce } = await fetchBotApi('/auth/nonce')
            const message = `Sign this message to prove you own this wallet.\nNonce: ${nonce}`
            const signature = await signMessageAsync({ message })

            const { token } = await fetchBotApi('/auth/verify', {
                method: 'POST',
                body: JSON.stringify({ address, signature, nonce, message }),
            })

            localStorage.setItem('botAdminToken', `Bearer ${token}`)
            setIsAuthenticated(true)
        } catch (err: any) {
            console.error('Login failed:', err)
            alert(err.message || 'Signature verification failed or wallet not authorized.')
        } finally {
            setIsSigningIn(false)
        }
    }

    const logout = () => {
        localStorage.removeItem('botAdminToken')
        setIsAuthenticated(false)
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, isSigningIn, mounted, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
