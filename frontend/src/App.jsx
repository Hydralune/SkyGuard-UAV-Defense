import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import Layout from '@/components/Layout'
import Dashboard from '@/pages/Dashboard'
import AttackScenarios from '@/pages/AttackScenarios'
import DefenseScenarios from '@/pages/DefenseScenarios'
import CustomScenarios from '@/pages/CustomScenarios'
import Visualization from '@/pages/Visualization'
import ExerciseStatus from '@/pages/ExerciseStatus'
import Reports from '@/pages/Reports'
import TeamManagement from '@/pages/TeamManagement'
import Operations from '@/pages/Operations'

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="skyguard-ui-theme">
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attack-scenarios" element={<AttackScenarios />} />
            <Route path="/defense-scenarios" element={<DefenseScenarios />} />
            <Route path="/custom-scenarios" element={<CustomScenarios />} />
            <Route path="/visualization" element={<Visualization />} />
            <Route path="/exercise-status" element={<ExerciseStatus />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/team-management" element={<TeamManagement />} />
            <Route path="/operations" element={<Operations />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App

