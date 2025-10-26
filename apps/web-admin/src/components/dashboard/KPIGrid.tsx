const kpis = [
  { title: "Questions Today", value: "0" },
  { title: "Avg Response Time", value: "0 ms" },
  { title: "Fallback Rate", value: "0%" },
  { title: "Active Documents", value: "0" },
];

const KPIGrid = () => {
  return (
    <section className="dashboard-kpis">
      {kpis.map((kpi) => (
        <div key={kpi.title} className="dashboard-kpi-card">
          <p>{kpi.title}</p>
          <p className="dashboard-kpi-card__value">{kpi.value}</p>
        </div>
      ))}
    </section>
  );
};

export default KPIGrid;
