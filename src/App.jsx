import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/useStore'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Income from './pages/Income'
import Bills from './pages/Bills'
import Assets from './pages/Assets'
import Liabilities from './pages/Liabilities'
import Goals from './pages/Goals'
import CostOfLiving from './pages/CostOfLiving'
import Scenarios from './pages/Scenarios'
import Settings from './pages/Settings'

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/income" element={<Income />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/assets" element={<Assets />} />
            <Route path="/liabilities" element={<Liabilities />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/cost-of-living" element={<CostOfLiving />} />
            <Route path="/scenarios" element={<Scenarios />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  )
}
