
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartData {
  period: string;
  questions: number;
}

const data: ChartData[] = [
  { period: "Mon", questions: 0 },
  { period: "Tue", questions: 0 },
  { period: "Wed", questions: 0 },
  { period: "Thu", questions: 0 },
  { period: "Fri", questions: 0 },
];

const TrendsChart = () => 

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="period" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={false} />
              <Line
                type="monotone"
                dataKey="questions"
                stroke="#059669"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

export default TrendsChart
