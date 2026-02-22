import { useStore } from '../store/useStore'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'

export default function ProfilePicker() {
  const { setProfile } = useStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary-600 mb-2">Financial Planner</h1>
        <p className="text-gray-500 mb-8">Select a profile to get started</p>
        <div className="flex gap-6">
          {[
            { id: 'a', label: 'User A' },
            { id: 'b', label: 'User B' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setProfile(id)}
              className="flex flex-col items-center gap-3 px-8 py-6 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-primary-50 transition-all cursor-pointer border border-gray-200"
            >
              <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="w-6 h-6" />
              </div>
              <span className="text-lg font-semibold text-gray-700">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
