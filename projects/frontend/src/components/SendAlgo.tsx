import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import * as algokit from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface SendAlgoProps {
  openModal: boolean
  closeModal: () => void
}

const MICROALGOS_PER_ALGO = 1_000_000

function algoStringToMicroAlgos(amountStr: string): number | null {
  const value = amountStr.trim()
  if (!value) return null

  // Allow only integer or up to 6 decimal places for ALGO.
  if (!/^\d+(\.\d{1,6})?$/.test(value)) return null

  const [wholePart, fractionalPart = ''] = value.split('.')
  const whole = Number(wholePart)
  if (!Number.isSafeInteger(whole)) return null

  const fractionalPadded = (fractionalPart + '000000').slice(0, 6)
  const fractional = Number(fractionalPadded)
  if (!Number.isSafeInteger(fractional)) return null

  const micro = whole * MICROALGOS_PER_ALGO + fractional
  if (!Number.isSafeInteger(micro) || micro <= 0) return null

  return micro
}

const SendAlgo = ({ openModal, closeModal }: SendAlgoProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const onSend = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault() // Important: prevent <form method="dialog"> auto closing

    if (!activeAddress) {
      enqueueSnackbar('Connect a wallet first', { variant: 'error' })
      return
    }

    const receiver = to.trim()
    const microAlgos = algoStringToMicroAlgos(amount)

    if (!receiver || !algosdk.isValidAddress(receiver) || microAlgos === null) {
      enqueueSnackbar('Enter valid address and amount', { variant: 'error' })
      return
    }

    setLoading(true)
    try {
      await algorand.send.payment({
        sender: activeAddress,
        receiver,
        amount: algokit.microAlgos(microAlgos),
      })
      enqueueSnackbar('Payment sent', { variant: 'success' })
      closeModal()
    } catch (err) {
      enqueueSnackbar((err as Error).message ?? 'Transaction failed', { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <dialog id="send_algo_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-2xl mb-4">Send Algo</h3>

        <div className="flex flex-col gap-3">
          <input
            className="input input-bordered"
            placeholder="Recipient address"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            className="input input-bordered"
            placeholder="Amount (ALGO)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </div>

        <div className="modal-action">
          <button className={`btn btn-primary ${loading ? 'loading' : ''}`} onClick={onSend} disabled={loading}>
            Send
          </button>
          <button className="btn" onClick={closeModal} disabled={loading}>
            Close
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default SendAlgo
