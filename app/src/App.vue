<script setup>
import { onMounted } from 'vue'
import { useWalletStore } from './stores/walletStore'

const walletStore = useWalletStore()

onMounted(() => {
    walletStore.checkConnection()
    
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
                walletStore.address = accounts[0]
                walletStore.isConnected = true
                localStorage.setItem('wallet_address', accounts[0])
            } else {
                walletStore.disconnect()
            }
        })
    }
})
</script>

<template>
  <router-view />
</template>

<style scoped>
</style>
