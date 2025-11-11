import SettingsForm from '../components/settings/SettingsForm'

const SettingsPage = () => {
  return (
    <section className="flex flex-col gap-6">
      <header>
        <h2 className="mb-1 text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-base text-slate-600">Adjust retrieval thresholds, fallback channels, and quick actions.</p>
      </header>
      <SettingsForm />
    </section>
  )
}

export default SettingsPage
