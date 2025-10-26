import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { period: "Mon", questions: 0 },
  { period: "Tue", questions: 0 },
  { period: "Wed", questions: 0 },
  { period: "Thu", questions: 0 },
  { period: "Fri", questions: 0 },
];

const TrendsChart = () => {
  return (
    <section className="dashboard-card">
      <h2 className="dashboard-card__title">Weekly Activity</h2>
      <div className="dashboard-card__chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="period" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip cursor={false} />
            <Line type="monotone" dataKey="questions" stroke="#059669" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};

export default TrendsChart;
