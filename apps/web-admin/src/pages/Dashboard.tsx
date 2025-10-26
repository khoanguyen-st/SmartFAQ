import KPIGrid from "../components/dashboard/KPIGrid";
import TrendsChart from "../components/dashboard/TrendsChart";
import UnansweredPanel from "../components/dashboard/UnansweredPanel";

const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <KPIGrid />
      <TrendsChart />
      <UnansweredPanel />
    </div>
  );
};

export default DashboardPage;
