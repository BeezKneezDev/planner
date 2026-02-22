export const CATEGORIES = ['housing', 'utilities', 'food', 'transport', 'education', 'healthcare', 'lifestyle', 'other']

export const DEFAULT_CATEGORY_RULES = [
  // Food & Groceries
  { keyword: 'pak n save', category: 'food' },
  { keyword: 'paknsave', category: 'food' },
  { keyword: 'countdown', category: 'food' },
  { keyword: 'woolworths', category: 'food' },
  { keyword: 'new world', category: 'food' },
  { keyword: 'four square', category: 'food' },
  { keyword: 'freshchoice', category: 'food' },
  { keyword: 'supervalue', category: 'food' },
  { keyword: 'lynmore super', category: 'food' },
  { keyword: 'dairy', category: 'food' },
  { keyword: 'bakery', category: 'food' },
  { keyword: 'butcher', category: 'food' },
  { keyword: 'dominos', category: 'food' },
  { keyword: 'mcdonalds', category: 'food' },
  { keyword: 'burger king', category: 'food' },
  { keyword: 'burgerfuel', category: 'food' },
  { keyword: 'kfc', category: 'food' },
  { keyword: 'subway', category: 'food' },
  { keyword: 'don kebab', category: 'food' },
  { keyword: 'st pierre', category: 'food' },
  { keyword: 'sequoia eater', category: 'food' },
  { keyword: 'uber eats', category: 'food' },
  { keyword: 'menulog', category: 'food' },
  { keyword: 'hello fresh', category: 'food' },
  { keyword: 'my food bag', category: 'food' },

  // Utilities
  { keyword: 'mercury', category: 'utilities' },
  { keyword: 'genesis energy', category: 'utilities' },
  { keyword: 'contact energy', category: 'utilities' },
  { keyword: 'meridian', category: 'utilities' },
  { keyword: 'electric kiwi', category: 'utilities' },
  { keyword: 'powershop', category: 'utilities' },
  { keyword: 'flick', category: 'utilities' },
  { keyword: 'watercare', category: 'utilities' },
  { keyword: 'spark', category: 'utilities' },
  { keyword: 'vodafone', category: 'utilities' },
  { keyword: 'one nz', category: 'utilities' },
  { keyword: '2degrees', category: 'utilities' },
  { keyword: 'skinny', category: 'utilities' },
  { keyword: 'orcon', category: 'utilities' },
  { keyword: 'slingshot', category: 'utilities' },
  { keyword: 'trustpower', category: 'utilities' },
  { keyword: 'nova energy', category: 'utilities' },

  // Housing
  { keyword: 'rent', category: 'housing' },
  { keyword: 'mortgage', category: 'housing' },
  { keyword: 'loan repay', category: 'housing' },
  { keyword: 'loan interest', category: 'housing' },
  { keyword: 'body corp', category: 'housing' },
  { keyword: 'rates', category: 'housing' },
  { keyword: 'bunnings', category: 'housing' },
  { keyword: 'mitre 10', category: 'housing' },
  { keyword: 'placemakers', category: 'housing' },
  { keyword: 'insurance', category: 'housing' },
  { keyword: 'tower insurance', category: 'housing' },
  { keyword: 'ami insurance', category: 'housing' },
  { keyword: 'ami insur', category: 'housing' },
  { keyword: 'state insurance', category: 'housing' },
  { keyword: 'aa insurance', category: 'housing' },
  { keyword: 'real estate', category: 'housing' },

  // Transport
  { keyword: 'bp connect', category: 'transport' },
  { keyword: 'bp 2go', category: 'transport' },
  { keyword: 'z energy', category: 'transport' },
  { keyword: 'gull', category: 'transport' },
  { keyword: 'mobil', category: 'transport' },
  { keyword: 'nzta', category: 'transport' },
  { keyword: 'at hop', category: 'transport' },
  { keyword: 'snapper', category: 'transport' },
  { keyword: 'uber', category: 'transport' },
  { keyword: 'parking', category: 'transport' },
  { keyword: 'autoplus', category: 'transport' },
  { keyword: 'wof', category: 'transport' },
  { keyword: 'rego', category: 'transport' },
  { keyword: 'vtnz', category: 'transport' },

  // Healthcare
  { keyword: 'pharmacy', category: 'healthcare' },
  { keyword: 'chemist wareh', category: 'healthcare' },
  { keyword: 'chemist', category: 'healthcare' },
  { keyword: 'doctor', category: 'healthcare' },
  { keyword: 'medical', category: 'healthcare' },
  { keyword: 'dental', category: 'healthcare' },
  { keyword: 'dentist', category: 'healthcare' },
  { keyword: 'hospital', category: 'healthcare' },
  { keyword: 'osteo', category: 'healthcare' },
  { keyword: 'physio', category: 'healthcare' },
  { keyword: 'lambert osteo', category: 'healthcare' },
  { keyword: 'aia', category: 'healthcare' },
  { keyword: 'southern cross', category: 'healthcare' },
  { keyword: 'nib', category: 'healthcare' },
  { keyword: 'unichem', category: 'healthcare' },
  { keyword: 'life pharmacy', category: 'healthcare' },

  // Education
  { keyword: 'university', category: 'education' },
  { keyword: 'studylink', category: 'education' },
  { keyword: 'toi ohomai', category: 'education' },
  { keyword: 'orange swim', category: 'education' },
  { keyword: 'swim school', category: 'education' },
  { keyword: 'school', category: 'education' },
  { keyword: 'polytech', category: 'education' },
  { keyword: 'whitireia', category: 'education' },
  { keyword: 'weltec', category: 'education' },

  // Lifestyle
  { keyword: 'netflix', category: 'lifestyle' },
  { keyword: 'spotify', category: 'lifestyle' },
  { keyword: 'disney', category: 'lifestyle' },
  { keyword: 'neon', category: 'lifestyle' },
  { keyword: 'sky tv', category: 'lifestyle' },
  { keyword: 'apple', category: 'lifestyle' },
  { keyword: 'google', category: 'lifestyle' },
  { keyword: 'amazon', category: 'lifestyle' },
  { keyword: 'warehouse', category: 'lifestyle' },
  { keyword: 'kmart', category: 'lifestyle' },
  { keyword: 'farmers', category: 'lifestyle' },
  { keyword: 'briscoes', category: 'lifestyle' },
  { keyword: 'rebel', category: 'lifestyle' },
  { keyword: 'cotton on', category: 'lifestyle' },
  { keyword: 'noel leeming', category: 'lifestyle' },
  { keyword: 'gym', category: 'lifestyle' },
  { keyword: 'les mills', category: 'lifestyle' },
  { keyword: 'cinema', category: 'lifestyle' },
  { keyword: 'event cinemas', category: 'lifestyle' },
  { keyword: 'hoyts', category: 'lifestyle' },
  { keyword: 'playstation', category: 'lifestyle' },
  { keyword: 'steam', category: 'lifestyle' },
  { keyword: 'mighty ape', category: 'lifestyle' },
]

export function categorizeTransaction(description, customRules = []) {
  const lower = description.toLowerCase()
  // Check custom (user-learned) rules first
  for (const rule of customRules) {
    if (lower.includes(rule.keyword.toLowerCase())) {
      return rule.category
    }
  }
  // Then check defaults
  for (const rule of DEFAULT_CATEGORY_RULES) {
    if (lower.includes(rule.keyword)) {
      return rule.category
    }
  }
  return 'other'
}
