import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useWalletStore = defineStore('wallet', () => {
    const isConnected = ref(!!localStorage.getItem('wallet_address'))
    const address = ref(localStorage.getItem('wallet_address') || '')
    const loading = ref(false)
    const error = ref('')

    const hasMetaMask = () => typeof window !== 'undefined' && typeof window.ethereum !== 'undefined'

    async function checkConnection() {
        if (!hasMetaMask()) return
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
                address.value = accounts[0]
                isConnected.value = true
                localStorage.setItem('wallet_address', accounts[0])
            } else {
                disconnect()
            }
        } catch (err) {
            console.error('Error checking connection:', err)
        }
    }

    async function connect() {
        if (!hasMetaMask()) {
            error.value = 'MetaMask belum terpasang. Silakan install MetaMask terlebih dahulu.'
            return { success: false, error: error.value }
        }

        loading.value = true
        error.value = ''
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            if (accounts.length > 0) {
                address.value = accounts[0]
                isConnected.value = true
                localStorage.setItem('wallet_address', accounts[0])
                return { success: true }
            }
            throw new Error('No accounts found')
        } catch (err) {
            error.value = err.message || 'Failed to connect wallet'
            return { success: false, error: error.value }
        } finally {
            loading.value = false
        }
    }
    
    function disconnect() {
        isConnected.value = false
        address.value = ''
        localStorage.removeItem('wallet_address')
    }

    // DEMO MODE
    // Sementara digunakan untuk presentasi client.
    // Jangan dihapus karena fitur MetaMask akan diaktifkan kembali.
    const ENABLE_METAMASK_VERIFICATION = true

    const shortAddress = () => {
        if (!address.value) return ''
        return `${address.value.substring(0, 6)}...${address.value.substring(address.value.length - 4)}`.toUpperCase()
    }

    // DEMO MODE FUNCTION
    async function connectDemo() {
        loading.value = true
        error.value = ''
        
        return new Promise((resolve) => {
            setTimeout(() => {
                const demoAddress = '0xDemo1234567890abcdef1234567890abcdef1234'
                address.value = demoAddress
                isConnected.value = true
                localStorage.setItem('wallet_address', demoAddress)
                loading.value = false
                resolve({ success: true })
            }, 1000)
        })
    }

    return {
        isConnected,
        address,
        loading,
        error,
        hasMetaMask,
        checkConnection,
        connect,
        disconnect,
        shortAddress,
        ENABLE_METAMASK_VERIFICATION,
        connectDemo
    }
})
