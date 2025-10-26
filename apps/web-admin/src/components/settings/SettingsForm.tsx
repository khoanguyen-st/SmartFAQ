import { FormEvent, useState } from "react";

const defaultValues = {
  confidenceThreshold: 60,
  topK: 5,
  maxWords: 300,
  fallbackChannels: ["Email"],
  quickActions: ["Admission requirements", "Tuition fees"],
  welcomeText: "Welcome to Greenwich SmartFAQ",
};

const SettingsForm = () => {
  const [values, setValues] = useState(defaultValues);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    // TODO: wire to API
    console.info("Submitted settings", values);
  };

  return (
    <form onSubmit={handleSubmit} className="settings-form">
      <label>
        Confidence Threshold
        <input
          type="number"
          value={values.confidenceThreshold}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, confidenceThreshold: Number(event.target.value) }))
          }
        />
      </label>
      <label>
        Top K Documents
        <input
          type="number"
          value={values.topK}
          onChange={(event) => setValues((prev) => ({ ...prev, topK: Number(event.target.value) }))}
        />
      </label>
      <label>
        Max Words
        <input
          type="number"
          value={values.maxWords}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, maxWords: Number(event.target.value) }))
          }
        />
      </label>
      <label className="settings-form__full">
        Welcome Message
        <textarea
          value={values.welcomeText}
          onChange={(event) => setValues((prev) => ({ ...prev, welcomeText: event.target.value }))}
        />
      </label>
      <button type="submit" className="settings-form__submit">
        Save Settings
      </button>
    </form>
  );
};

export default SettingsForm;
