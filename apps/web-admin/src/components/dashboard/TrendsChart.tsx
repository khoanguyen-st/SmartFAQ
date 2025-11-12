import { useState, useCallback } from "react";
import UploadModal from "./UploadModal";
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

const TrendsChart = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return (
    <>
      <section className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Weekly Activity
          </h2>
          <button
            onClick={openModal}
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md transition duration-150 ease-in-out hover:bg-indigo-700"
          >
             Upload Document
          </button>
        </div>

        <hr className="mb-4 border-gray-100" />

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
      </section>

      <UploadModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
};

export default TrendsChart
