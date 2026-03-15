'use client'

import { useState, useEffect } from 'react'
import { parseUnits, isAddress, formatUnits } from 'viem'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts } from 'wagmi'
import { Loader2, AlertCircle, CheckCircle2, Coins, Droplets } from 'lucide-react'

const BATCH_TRANSFER_ADDRESS = "0x110769E12155d2d1875D42dcf66D7D92acA1E207"

const BATCH_TRANSFER_ABI = [
    {
        "inputs": [
            { "internalType": "address[]", "name": "receivers", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "distributeETH",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address[]", "name": "receivers", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "distributeERC20",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const ERC20_ABI = [
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }
]

type TransferType = 'ETH' | 'ERC20'

export function BatchTransferForm() {
    const { isConnected, address: userAddress } = useAccount()
    const [transferType, setTransferType] = useState<TransferType>('ETH')
    const [tokenAddress, setTokenAddress] = useState('')

    const [inputVal, setInputVal] = useState('')
    const [parsedData, setParsedData] = useState<{ address: `0x${string}`; amountStr: string; amountWei: bigint }[]>([])
    const [errorMsg, setErrorMsg] = useState('')
    const [isSingleAmountMode, setIsSingleAmountMode] = useState(false)
    const [globalAmount, setGlobalAmount] = useState('')

    // Token Data
    const { data: tokenData } = useReadContracts({
        contracts: [
            { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'symbol' },
            { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'decimals' },
            { address: tokenAddress as `0x${string}`, abi: ERC20_ABI, functionName: 'allowance', args: [userAddress, BATCH_TRANSFER_ADDRESS] },
        ],
        query: {
            enabled: transferType === 'ERC20' && isAddress(tokenAddress) && !!userAddress,
            refetchInterval: 5000 // poll allowance periodically just in case
        }
    })

    const tokenSymbol = tokenData?.[0]?.result as string | undefined
    const tokenDecimals = (tokenData?.[1]?.result as number | undefined) ?? 18
    const currentAllowance = (tokenData?.[2]?.result as bigint | undefined) ?? 0n

    // Write Contract
    const { writeContract, data: txHash, isPending: isTxPending, reset: resetTx } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

    const parseInput = (text: string) => {
        setErrorMsg('')
        if (transferType === 'ERC20' && !isAddress(tokenAddress)) {
            setErrorMsg('Please enter a valid ERC20 token address first.')
            return
        }

        const lines = text.split('\n').map(l => l.trim()).filter(l => l)
        const validEntries: { address: `0x${string}`; amountStr: string; amountWei: bigint }[] = []

        if (isSingleAmountMode) {
            let globalWei: bigint;
            try {
                if (!globalAmount || globalAmount.trim() === '') throw new Error('Empty amount')
                globalWei = parseUnits(globalAmount, tokenDecimals)
            } catch (e) {
                setErrorMsg('Please enter a valid global amount')
                return
            }

            for (const line of lines) {
                const address = line.split(/[\s,]+/)[0]
                if (!isAddress(address)) {
                    setErrorMsg(`Invalid address found: ${address}`)
                    return
                }
                validEntries.push({ address: address as `0x${string}`, amountStr: globalAmount, amountWei: globalWei })
            }
        } else {
            for (const line of lines) {
                const parts = line.split(/[\s,]+/)
                if (parts.length < 2) continue

                const address = parts[0]
                const amountStr = parts[1]

                if (!isAddress(address)) {
                    setErrorMsg(`Invalid address found: ${address}`)
                    return
                }

                try {
                    const amountWei = parseUnits(amountStr, tokenDecimals)
                    validEntries.push({ address: address as `0x${string}`, amountStr, amountWei })
                } catch (err) {
                    setErrorMsg(`Invalid amount format for address ${address}: ${amountStr}`)
                    return
                }
            }
        }

        if (validEntries.length === 0) {
            setErrorMsg(isSingleAmountMode ? 'No valid addresses could be parsed.' : 'No valid entries could be parsed. Format should be: 0xAddress Amount')
            return
        }

        setParsedData(validEntries)
    }

    const totalValueWei = parsedData.reduce((acc, curr) => acc + curr.amountWei, 0n)
    const needsApproval = transferType === 'ERC20' && currentAllowance < totalValueWei

    const handleApprove = () => {
        if (!isAddress(tokenAddress)) return
        resetTx()
        writeContract({
            address: tokenAddress as `0x${string}`,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [BATCH_TRANSFER_ADDRESS, totalValueWei],
        })
    }

    const handleSendBatch = () => {
        resetTx()
        const receivers = parsedData.map(d => d.address)
        const amounts = parsedData.map(d => d.amountWei)

        if (transferType === 'ETH') {
            writeContract({
                address: BATCH_TRANSFER_ADDRESS as `0x${string}`,
                abi: BATCH_TRANSFER_ABI,
                functionName: 'distributeETH',
                args: [receivers, amounts],
                value: totalValueWei
            })
        } else {
            writeContract({
                address: BATCH_TRANSFER_ADDRESS as `0x${string}`,
                abi: BATCH_TRANSFER_ABI,
                functionName: 'distributeERC20',
                args: [tokenAddress, receivers, amounts],
            })
        }
    }

    // Effect to clear parsed data if decimals change to avoid corrupted wei amounts
    useEffect(() => {
        setParsedData([])
    }, [tokenDecimals, transferType])

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            {/* Type Selector */}
            <div className="flex bg-[#0a1510] rounded-lg p-1 border border-[#1e3d2f]">
                <button
                    onClick={() => setTransferType('ETH')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${transferType === 'ETH' ? 'bg-[#1e3d2f] text-[#4ade80] shadow-sm' : 'text-[#9fb8a8] hover:text-white'}`}
                >
                    <Droplets className="w-4 h-4" /> Native Gas (ETH)
                </button>
                <button
                    onClick={() => setTransferType('ERC20')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${transferType === 'ERC20' ? 'bg-[#1e3d2f] text-[#4ade80] shadow-sm' : 'text-[#9fb8a8] hover:text-white'}`}
                >
                    <Coins className="w-4 h-4" /> Custom ERC-20
                </button>
            </div>

            {transferType === 'ERC20' && (
                <div className="space-y-2 bg-[#4ade80]/5 p-4 rounded-xl border border-[#4ade80]/10">
                    <label className="text-sm font-medium text-[#9fb8a8]">
                        ERC-20 Token Contract Address
                    </label>
                    <input
                        type="text"
                        value={tokenAddress}
                        onChange={(e) => setTokenAddress(e.target.value)}
                        className="w-full bg-[#0a1510] border border-[#1e3d2f] rounded-lg p-3 text-sm font-mono focus:ring-1 focus:ring-[#4ade80] focus:border-[#4ade80] transition-colors text-white"
                        placeholder="0x..."
                    />
                    {tokenSymbol && (
                        <p className="text-xs text-[#4ade80] font-medium">✓ Detected Token: {tokenSymbol} ({tokenDecimals} decimals)</p>
                    )}
                </div>
            )}

            <div className="flex bg-[#0a1510] rounded-lg p-1 border border-[#1e3d2f]">
                <button
                    onClick={() => { setIsSingleAmountMode(false); setParsedData([]); setErrorMsg('') }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isSingleAmountMode ? 'bg-[#1e3d2f] text-white shadow-sm' : 'text-[#9fb8a8] hover:text-white'}`}
                >
                    Paste List (Address, Amount)
                </button>
                <button
                    onClick={() => { setIsSingleAmountMode(true); setParsedData([]); setErrorMsg('') }}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isSingleAmountMode ? 'bg-[#1e3d2f] text-white shadow-sm' : 'text-[#9fb8a8] hover:text-white'}`}
                >
                    Single Global Amount
                </button>
            </div>

            {isSingleAmountMode && (
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#9fb8a8]">
                        Amount to send to each wallet
                    </label>
                    <input
                        type="text"
                        value={globalAmount}
                        onChange={(e) => setGlobalAmount(e.target.value)}
                        className="w-full bg-[#0a1510] border border-[#1e3d2f] rounded-xl p-4 text-sm font-mono focus:ring-1 focus:ring-[#4ade80] focus:border-[#4ade80] transition-colors text-white"
                        placeholder="0.5"
                    />
                </div>
            )}

            <div className="space-y-2">
                <label className="text-sm font-medium text-[#9fb8a8]">
                    {isSingleAmountMode ? "Paste Wallet Addresses (One per line or comma separated)" : "Paste Wallet Addresses and Amounts (Comma, Space, or Tab separated)"}
                </label>
                <p className="text-xs text-[#6b9b7f]">
                    {isSingleAmountMode ? "Example: 0x123...abc\n0x456...def" : "Example: 0x123...abc, 1.5"}
                </p>
                <textarea
                    value={inputVal}
                    onChange={(e) => {
                        setInputVal(e.target.value)
                        setParsedData([])
                    }}
                    className="w-full h-48 bg-[#0a1510] border border-[#1e3d2f] rounded-xl p-4 text-sm font-mono focus:ring-1 focus:ring-[#4ade80] focus:border-[#4ade80] transition-colors text-white"
                    placeholder={isSingleAmountMode ? "0x123...ABC\n0x456...DEF\n0x789...GHI" : "0x123...ABC, 0.5\n0x456...DEF, 1.25\n0x789...GHI, 2"}
                />
            </div>

            <button
                onClick={() => parseInput(inputVal)}
                className="w-full py-3 bg-[#0a1510] hover:bg-[#1e3d2f] border border-[#1e3d2f] text-white rounded-xl font-medium transition-colors"
            >
                Validate List
            </button>

            {errorMsg && (
                <div className="flex items-center gap-2 text-[#e85a4f] bg-[#e85a4f]/10 p-4 rounded-xl text-sm border border-[#e85a4f]/20">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}

            {parsedData.length > 0 && !errorMsg && (
                <div className="space-y-4">
                    <div className="bg-[#4ade80]/10 border border-[#4ade80]/20 p-4 rounded-xl">
                        <h3 className="text-[#4ade80] font-medium mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Ready to Distribute {transferType === 'ERC20' ? tokenSymbol || 'Tokens' : 'ETH'}
                        </h3>
                        <div className="flex justify-between text-sm text-[#9fb8a8] mb-2">
                            <span>Total Wallets:</span>
                            <span className="font-mono text-[#4ade80] font-bold">{parsedData.length}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#9fb8a8] mb-2">
                            <span>Total Value:</span>
                            <span className="font-mono text-[#4ade80] font-bold">{formatUnits(totalValueWei, tokenDecimals)}</span>
                        </div>
                        {transferType === 'ERC20' && (
                            <div className="flex justify-between text-sm text-[#9fb8a8] mt-2 pt-2 border-t border-[#4ade80]/20">
                                <span>Current Allowance:</span>
                                <span className={`font-mono font-bold ${needsApproval ? 'text-amber-400' : 'text-[#4ade80]'}`}>
                                    {formatUnits(currentAllowance, tokenDecimals)}
                                </span>
                            </div>
                        )}
                    </div>

                    {needsApproval ? (
                        <button
                            onClick={handleApprove}
                            disabled={!isConnected || isTxPending || isConfirming}
                            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-[#0a1510] rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2"
                        >
                            {(isTxPending || isConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isTxPending ? "Confirming in Wallet..." :
                                isConfirming ? "Approving on Network..." :
                                    "Approve Tokens 🔓"}
                        </button>
                    ) : (
                        <button
                            onClick={handleSendBatch}
                            disabled={!isConnected || isTxPending || isConfirming}
                            className="w-full py-3 bg-[#e85a4f] hover:bg-[#d94a3f] text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex justify-center items-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {(isTxPending || isConfirming) && <Loader2 className="w-5 h-5 animate-spin" />}
                            {isTxPending ? "Confirming in Wallet..." :
                                isConfirming ? "Confirming on Network..." :
                                    !isConnected ? "Connect Wallet to Send" :
                                        "Send Tokens 🚀"}
                        </button>
                    )}

                    {isConfirmed && txHash && (
                        <div className="text-center text-sm text-[#4ade80] mt-4">
                            Transaction Successful! <br />
                            <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-[#22c55e]">View on BaseScan</a>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
