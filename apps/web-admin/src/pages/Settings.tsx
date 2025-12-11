import SettingsForm from '../components/settings/SettingsForm'

const SettingsPage = () => {
  return (
    <section className="settings__container flex h-[calc(100vh-81px)] flex-col gap-6 overflow-auto bg-white p-6 ">
      <header>
        <div className="pl-2">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">System Settings</h2>
          <p className="text-base text-slate-600">Adjust retrieval thresholds, fallback channels, and quick actions.</p>
        </div>
      </header>
      <SettingsForm />
    </section>
  )
}

export default SettingsPage
