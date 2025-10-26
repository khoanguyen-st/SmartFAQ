import SettingsForm from "../components/settings/SettingsForm";

const SettingsPage = () => {
  return (
    <section className="settings-page">
      <header className="settings-page__header">
        <h2>System Settings</h2>
        <p>Adjust retrieval thresholds, fallback channels, and quick actions.</p>
      </header>
      <SettingsForm />
    </section>
  );
};

export default SettingsPage;
