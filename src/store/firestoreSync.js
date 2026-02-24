import { doc, getDoc, setDoc, collection, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'

const BATCH_SIZE = 2000

export async function loadUserData(uid) {
  const profileRef = doc(db, 'users', uid, 'profile', 'data')
  const profileSnap = await getDoc(profileRef)

  let data = {}
  if (profileSnap.exists()) {
    data = profileSnap.data()
  }

  // Load transaction batches
  const txCol = collection(db, 'users', uid, 'transactions')
  const txSnap = await getDocs(txCol)
  let transactions = []
  const batches = []
  txSnap.forEach((d) => batches.push(d.data()))
  batches.sort((a, b) => (a.batch || 0) - (b.batch || 0))
  for (const b of batches) {
    if (b.items) transactions = transactions.concat(b.items)
  }

  return { ...data, transactions }
}

export async function saveProfileData(uid, state) {
  const { transactions: _tx, ...profileData } = state
  const profileRef = doc(db, 'users', uid, 'profile', 'data')
  await setDoc(profileRef, { ...profileData, updatedAt: serverTimestamp() })
}

export async function saveTransactions(uid, transactions) {
  if (!transactions) return

  // Chunk transactions into batches of BATCH_SIZE
  const chunks = []
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    chunks.push(transactions.slice(i, i + BATCH_SIZE))
  }
  // Always write at least one batch (empty) so we can clear old data
  if (chunks.length === 0) chunks.push([])

  const batch = writeBatch(db)
  for (let i = 0; i < chunks.length; i++) {
    const ref = doc(db, 'users', uid, 'transactions', `batch-${i}`)
    batch.set(ref, { batch: i, items: chunks[i], updatedAt: serverTimestamp() })
  }

  // Clean up old batches that may exist beyond current count
  const txCol = collection(db, 'users', uid, 'transactions')
  const existing = await getDocs(txCol)
  existing.forEach((d) => {
    const batchNum = d.data().batch
    if (batchNum !== undefined && batchNum >= chunks.length) {
      batch.delete(d.ref)
    }
  })

  await batch.commit()
}
