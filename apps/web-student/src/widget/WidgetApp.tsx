export default function WidgetApp({ title = 'Hello Widget!' }) {
  return (
    <div style={{ padding: 12, background: 'white', borderRadius: 8 }}>
      <h3 style={{ color: 'hsl(3,71%,56%)' }}>{title}</h3>
      <p>Widget chạy bằng React + Vite — Local Test OK.</p>
    </div>
  )
}
