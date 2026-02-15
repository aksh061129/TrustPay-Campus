import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface CreateASAProps {
  openModal: boolean
  closeModal: () => void
}

const ASA_MIN_BALANCE_INCREASE_MICROALGOS = 200_000n

function toBigIntAmount(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'number' && Number.isFinite(value) && Number.isSafeInteger(value)) return BigInt(value)
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value)
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const nested =
      obj.microAlgos ??
      obj.microAlgo ??
      obj.amount ??
      (obj.balance as Record<string, unknown> | undefined)?.microAlgos ??
      (obj.balance as Record<string, unknown> | undefined)?.microAlgo
    if (typeof nested === 'bigint') return nested
    if (typeof nested === 'number' && Number.isFinite(nested) && Number.isSafeInteger(nested)) return BigInt(nested)
    if (typeof nested === 'string' && /^\d+$/.test(nested)) return BigInt(nested)
  }
  return 0n
}

const CreateASA = ({ openModal, closeModal }: CreateASAProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [name, setName] = useState('MyToken')
  const [unit, setUnit] = useState('MTK')
  const [decimals, setDecimals] = useState('6')
  const [total, setTotal] = useState('1000000')
  const [inlineError, setInlineError] = useState('')
  const [balanceSnapshot, setBalanceSnapshot] = useState<{
    balanceMicro: bigint
    minBalanceMicro: bigint
    spendableMicro: bigint
    requiredSpendableMicro: bigint
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const onCreate = async () => {
    setInlineError('')
    setBalanceSnapshot(null)
    if (!activeAddress) {
      const message = 'Connect a wallet first'
      setInlineError(message)
      return enqueueSnackbar(message, { variant: 'error' })
    }

    if (!/^\d+$/.test(total.trim())) {
      const message = 'Total must be a positive integer in base units.'
      setInlineError(message)
      return enqueueSnackbar(message, { variant: 'error' })
    }

    setLoading(true)
    try {
      // Pre-check spendable balance before ASA create.
      const accountInfo = (await algorand.account.getInformation(activeAddress)) as Record<string, unknown>
      const balanceMicro = toBigIntAmount(
        accountInfo.balance ?? accountInfo.amount ?? accountInfo['amount-without-pending-rewards'],
      )
      const minBalanceMicro = toBigIntAmount(
        accountInfo.minBalance ?? accountInfo['min-balance'],
      )
      const spendableMicro = balanceMicro - minBalanceMicro
      const suggestedParams = await algorand.getSuggestedParams()
      const estimatedFeeMicro = toBigIntAmount((suggestedParams as unknown as Record<string, unknown>).minFee ?? (suggestedParams as unknown as Record<string, unknown>).fee) || 1_000n
      const requiredSpendableMicro = ASA_MIN_BALANCE_INCREASE_MICROALGOS + estimatedFeeMicro

      setBalanceSnapshot({
        balanceMicro,
        minBalanceMicro,
        spendableMicro,
        requiredSpendableMicro,
      })

      if (spendableMicro < requiredSpendableMicro) {
        const deficitMicro = requiredSpendableMicro - (spendableMicro > 0n ? spendableMicro : 0n)
        const deficitAlgo = Number(deficitMicro) / 1_000_000
        const message = `Insufficient spendable ALGO. You must keep minimum required by Algorand. Add at least ${deficitAlgo.toFixed(6)} ALGO to proceed.`
        setInlineError(message)
        enqueueSnackbar(message, { variant: 'error' })
        setLoading(false)
        return
      }

      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: BigInt(total),
        decimals: Number(decimals),
        unitName: unit,
        assetName: name,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        defaultFrozen: false,
      })
      enqueueSnackbar(`ASA created. ID: ${result.assetId}`, { variant: 'success' })
      closeModal()
    } catch (e) {
      const message = (e as Error).message
      setInlineError(message)
      enqueueSnackbar(message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="create_asa_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Create Fungible Token (ASA)</h3>
        <div className="flex flex-col gap-3">
          <input className="input input-bordered" placeholder="Asset name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input input-bordered" placeholder="Unit name" value={unit} onChange={(e) => setUnit(e.target.value)} />
          <input className="input input-bordered" placeholder="Decimals" value={decimals} onChange={(e) => setDecimals(e.target.value)} />
          <input className="input input-bordered" placeholder="Total (base units)" value={total} onChange={(e) => setTotal(e.target.value)} />
          {inlineError ? <p className="text-sm text-red-600">{inlineError}</p> : null}
          {balanceSnapshot ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p>Current Balance: {(Number(balanceSnapshot.balanceMicro) / 1_000_000).toFixed(6)} ALGO</p>
              <p>Required Minimum Balance: {(Number(balanceSnapshot.minBalanceMicro) / 1_000_000).toFixed(6)} ALGO</p>
              <p>Spendable: {(Number(balanceSnapshot.spendableMicro) / 1_000_000).toFixed(6)} ALGO</p>
            </div>
          ) : null}
        </div>
        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onCreate} disabled={loading}>Create</button>
          <button className="btn" onClick={closeModal} disabled={loading}>Close</button>
        </div>
      </form>
    </dialog>
  )
}

export default CreateASA
