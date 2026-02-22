import { createContext, useContext, useReducer, useEffect, useState, useCallback } from 'react'

const StoreContext = createContext()

const PROFILE_KEY = 'planner-active-profile'
const OLD_STORAGE_KEY = 'planner-app-data'

function storageKey(profile) {
  return `planner-app-data-${profile}`
}

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

// Migrate old single-key data to profile A on first run
function migrateOldData() {
  const old = localStorage.getItem(OLD_STORAGE_KEY)
  if (old) {
    localStorage.setItem(storageKey('a'), old)
    localStorage.removeItem(OLD_STORAGE_KEY)
  }
}

function loadState(profile) {
  try {
    const saved = localStorage.getItem(storageKey(profile))
    if (saved) {
      const parsed = JSON.parse(saved)
      const state = { ...defaultState, ...parsed }
      state.costOfLiving = migrateCostOfLiving(parsed.costOfLiving)
      if (!state.homeName) state.homeName = defaultState.homeName
      if (!state.settings) state.settings = defaultState.settings
      if (state.liabilities) {
        state.liabilities = state.liabilities.map((l) =>
          l.paymentFrequency ? l : { ...l, paymentFrequency: 'monthly' }
        )
      }
      return state
    }
  } catch (e) {
    console.error('Failed to load state:', e)
  }
  return defaultState
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
    case 'LOAD_PROFILE':
      return action.state
    default:
      return state
  }
}

// Run migration once on module load
migrateOldData()

export function StoreProvider({ children }) {
  const [profile, setProfileState] = useState(() => localStorage.getItem(PROFILE_KEY) || null)
  const [state, dispatch] = useReducer(reducer, profile, (p) => p ? loadState(p) : defaultState)

  // Save state to profile-specific key
  useEffect(() => {
    if (profile) {
      localStorage.setItem(storageKey(profile), JSON.stringify(state))
    }
  }, [state, profile])

  const setProfile = useCallback((newProfile) => {
    localStorage.setItem(PROFILE_KEY, newProfile)
    setProfileState(newProfile)
    dispatch({ type: 'LOAD_PROFILE', state: loadState(newProfile) })
  }, [])

  return (
    <StoreContext.Provider value={{ state, dispatch, profile, setProfile }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
