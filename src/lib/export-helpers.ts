import apiClient, { APIResponse } from './api-client'
import { fetchBotApi } from './api'

// Define the shape of data we expect from the APIs
interface WebUser {
    id: string
    nombre_completo?: string
    email?: string
    telefono?: string
    telegram_id?: string
    wallet_address?: string
    edad?: number
    fecha_nacimiento?: string
    created_at?: string
    updated_at?: string
    [key: string]: any // allow other dynamic access
}

interface BotUser {
    id?: number
    telegramId?: string
    first_name?: string
    last_name?: string
    username?: string
    walletAddress?: string
    gamePLay?: {
        score?: number | string
    }
    [key: string]: any
}

interface ExportResult {
    success: boolean
    totalRows: number
    message?: string
}

/**
 * Escapes CSV field value to handle commas, quotes, and newlines
 */
const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);

    // If it contains quotes, commas, or newlines, wrap in quotes and double internal quotes
    if (/[",\n\r]/.test(stringValue)) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

/**
 * Downloads the given text content as a file named `filename`
 */
const downloadFile = (filename: string, content: string, type: 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Fetches all web users, handling pagination automatically
 */
async function fetchAllWebUsers(): Promise<WebUser[]> {
    let allUsers: WebUser[] = []
    let currentPage = 1
    let totalPages = 1

    // First request to get total pages and first batch
    const firstResponse = await apiClient.get<APIResponse<WebUser[]>>('/users', {
        params: { page: currentPage, limit: 100 }
    })

    if (!firstResponse.data.success || !firstResponse.data.data) {
        throw new Error('Failed to fetch web users')
    }

    allUsers = [...firstResponse.data.data]
    totalPages = firstResponse.data.pagination?.total_pages || 1

    // Fetch remaining pages in parallel for speed if there are any
    if (totalPages > 1) {
        const promises = []
        for (let i = 2; i <= totalPages; i++) {
            promises.push(
                apiClient.get<APIResponse<WebUser[]>>('/users', {
                    params: { page: i, limit: 100 }
                }).then(res => res.data.data || [])
            )
        }

        const remainingPagesData = await Promise.all(promises)
        remainingPagesData.forEach(pageData => {
            allUsers = [...allUsers, ...pageData]
        })
    }

    return allUsers
}

/**
 * Fetches all bot users using the new /export endpoint which supports pagination
 */
async function fetchAllBotUsers(): Promise<BotUser[]> {
    let allUsers: BotUser[] = []
    const take = 1000 // Get users in batches of 1000 since we're exporting
    let skip = 0
    let hasMore = true

    while (hasMore) {
        try {
            const response = await fetchBotApi(`/users/export?skip=${skip}&take=${take}`)

            if (response && response.success && Array.isArray(response.data)) {
                allUsers = [...allUsers, ...response.data]

                // If we received fewer items than requested, we've reached the end
                if (response.data.length < take) {
                    hasMore = false
                } else {
                    skip += take
                }
            } else {
                console.warn('Unexpected response format from Bot API export endpoint', response)
                hasMore = false
            }
        } catch (err) {
            console.error('Failed to fetch from Bot API export endpoint', err)
            throw new Error('Failed to fetch bot users for export')
        }
    }

    return allUsers
}

/**
 * Main export function called by the UI
 */
export async function generateCSV(webFields: Record<string, boolean>, botFields: Record<string, boolean>): Promise<ExportResult> {
    try {
        // 1. Fetch all data in parallel
        const [webUsers, botUsers] = await Promise.all([
            fetchAllWebUsers(),
            fetchAllBotUsers()
        ])

        // 2. Identify which fields to include
        const activeWebFields = Object.keys(webFields).filter(f => webFields[f])
        const activeBotFields = Object.keys(botFields).filter(f => botFields[f])

        // 3. Build a map of Telegram ID -> User Data for quick merging
        const botUsersMap = new Map<string, BotUser>()
        botUsers.forEach(botUser => {
            const tId = botUser.telegramId?.toString()
            if (tId) {
                // Flatten game play score
                const flattenedUser = { ...botUser }
                if (flattenedUser.gamePLay && typeof flattenedUser.gamePLay === 'object') {
                    flattenedUser.score = flattenedUser.gamePLay.score
                }
                botUsersMap.set(tId, flattenedUser)
            }
        })

        // 4. Generate CSV Headers
        const headerRow = [
            ...activeWebFields.map(f => `web_${f}`),
            ...activeBotFields.map(f => `bot_${f}`)
        ]

        let csvContent = headerRow.join(',') + '\n'
        let processedBotIds = new Set<string>()
        let totalRows = 0

        // 5. Process Web Users (and their corresponding Bot data if matched)
        webUsers.forEach(webUser => {
            const tId = webUser.telegram_id?.toString()
            let correspondingBotUser: BotUser | undefined

            if (tId && botUsersMap.has(tId)) {
                correspondingBotUser = botUsersMap.get(tId)
                processedBotIds.add(tId)
            }

            const rowData = [
                // Web fields
                ...activeWebFields.map(field => escapeCSV(webUser[field])),
                // Bot fields
                ...activeBotFields.map(field => escapeCSV(correspondingBotUser ? correspondingBotUser[field] : ''))
            ]

            csvContent += rowData.join(',') + '\n'
            totalRows++
        })

        // 6. Process remaining Bot Users who didn't have a Web account
        botUsers.forEach(botUser => {
            const tId = botUser.telegramId?.toString()

            // Skip if we already merged this bot user with a web user
            if (tId && processedBotIds.has(tId)) return;

            // Flatten game play score for this user too
            const flattenedUser = { ...botUser }
            if (flattenedUser.gamePLay && typeof flattenedUser.gamePLay === 'object') {
                flattenedUser.score = flattenedUser.gamePLay.score
            }

            const rowData = [
                // Empty Web fields
                ...activeWebFields.map(() => ''),
                // Bot fields
                ...activeBotFields.map(field => escapeCSV(flattenedUser[field]))
            ]

            csvContent += rowData.join(',') + '\n'
            totalRows++
        })

        // 7. Trigger download
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        downloadFile(`zuux-users-export-${timestamp}.csv`, csvContent, 'text/csv;charset=utf-8;')

        return { success: true, totalRows }
    } catch (error: any) {
        throw new Error(error.message || 'Failed to generate CSV')
    }
}
