import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { period: 'Mon', questions: 0 },
  { period: 'Tue', questions: 0 },
  { period: 'Wed', questions: 0 },
  { period: 'Thu', questions: 0 },
  { period: 'Fri', questions: 0 }
]

const TrendsChart = () => {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
      <h2 className="text-xl font-semibold text-slate-900">Weekly Activity</h2>
      <div className="mt-6 h-64">
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
  )
}

export default TrendsChart
