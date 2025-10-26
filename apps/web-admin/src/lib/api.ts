export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE_URL}/admin/metrics`);
  if (!res.ok) throw new Error("Failed to load metrics");
  return res.json();
}
