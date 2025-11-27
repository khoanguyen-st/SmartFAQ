import KPIGrid from '../components/dashboard/KPIGrid'
import TrendsChart from '../components/dashboard/TrendsChart'
import UnansweredPanel from '../components/dashboard/UnansweredPanel'

const DashboardPage = () => {
  return (
    <div className="flex flex-col gap-6">
      <KPIGrid />
      <TrendsChart />
      <UnansweredPanel />
    </div>
  )
}

export default DashboardPage
