import { createContext, useContext, useReducer, useEffect, useState, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'
import { loadUserData, saveProfileData, saveTransactions } from './firestoreSync'

const StoreContext = createContext()

const defaultState = {
  income: [],
  bills: [],
  assets: [],
  liabilities: [],
  goals: [],
  transactions: [],
  categoryRules: [],
  homeName: 'Rotorua',
  costOfLiving: {
    comparisons: [],
  },
  scenarios: [],
  settings: { minSurplusPercent: 0 },
}

function migrateComparisonCosts(loc) {
  const costs = {}
  for (const [key, val] of Object.entries(loc.costs || {})) {
    if (Array.isArray(val)) {
      costs[key] = val
    } else if (typeof val === 'number' || typeof val === 'string') {
      costs[key] = Number(val) > 0 ? [{ name: key.charAt(0).toUpperCase() + key.slice(1), amount: Number(val) }] : []
    } else {
      costs[key] = []
    }
  }
  for (const key of ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle']) {
    if (!costs[key]) costs[key] = []
  }
  return { ...loc, costs }
}

function migrateCostOfLiving(col) {
  if (!col) return defaultState.costOfLiving
  if (col.comparisons) {
    return { comparisons: col.comparisons.map(migrateComparisonCosts) }
  }
  if (col.locations && col.locations.length > 1) {
    return { comparisons: col.locations.slice(1).map(migrateComparisonCosts) }
  }
  return defaultState.costOfLiving
}

function migrateState(raw) {
  const state = { ...defaultState, ...raw }
  state.costOfLiving = migrateCostOfLiving(raw.costOfLiving)
  if (!state.homeName) state.homeName = defaultState.homeName
  if (!state.settings) state.settings = defaultState.settings
  if (state.liabilities) {
    state.liabilities = state.liabilities.map((l) =>
      l.paymentFrequency ? l : { ...l, paymentFrequency: 'monthly' }
    )
  }
  return state
}

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return { ...state, [action.collection]: [...state[action.collection], action.item] }
    case 'UPDATE_ITEM':
      return {
        ...state,
        [action.collection]: state[action.collection].map((item) =>
          item.id === action.item.id ? action.item : item
        ),
      }
    case 'DELETE_ITEM':
      return {
        ...state,
        [action.collection]: state[action.collection].filter((item) => item.id !== action.id),
      }
    case 'UPDATE_COST_OF_LIVING':
      return { ...state, costOfLiving: action.data }
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }
    case 'SET_HOME_NAME':
      return { ...state, homeName: action.value }
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.transactions }
    case 'SET_CATEGORY_RULES':
      return { ...state, categoryRules: action.rules }
    case 'IMPORT_DATA':
      return { ...defaultState, ...action.data }
    case 'LOAD_DATA':
      return action.state
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, defaultState)
  const [dataLoading, setDataLoading] = useState(true)
  const saveTimer = useRef(null)
  const prevUid = useRef(null)
  const isLoaded = useRef(false)

  // Load data from Firestore when user changes
  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!user) {
        prevUid.current = null
        isLoaded.current = false
        dispatch({ type: 'LOAD_DATA', state: defaultState })
        setDataLoading(false)
        return
      }

      if (user.uid === prevUid.current) return
      prevUid.current = user.uid
      isLoaded.current = false
      setDataLoading(true)

      try {
        const raw = await loadUserData(user.uid)
        if (cancelled) return
        const migrated = migrateState(raw)
        dispatch({ type: 'LOAD_DATA', state: migrated })
        isLoaded.current = true
      } catch (err) {
        console.error('Failed to load data from Firestore:', err)
        isLoaded.current = true
      } finally {
        if (!cancelled) setDataLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user])

  // Debounced save to Firestore
  const debouncedSave = useCallback((currentState, uid) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveProfileData(uid, currentState).catch((err) =>
        console.error('Failed to save profile data:', err)
      )
      saveTransactions(uid, currentState.transactions).catch((err) =>
        console.error('Failed to save transactions:', err)
      )
    }, 500)
  }, [])

  useEffect(() => {
    if (!user || !isLoaded.current) return
    debouncedSave(state, user.uid)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [state, user, debouncedSave])

  return (
    <StoreContext.Provider value={{ state, dispatch, dataLoading }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
