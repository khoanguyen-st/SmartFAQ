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
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-7 shadow-lg shadow-slate-900/10 sm:grid-cols-2 lg:grid-cols-3"
    >
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Confidence Threshold
        <input
          type="number"
          value={values.confidenceThreshold}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              confidenceThreshold: Number(event.target.value),
            }))
          }
          className="rounded-lg border border-indigo-200 px-3.5 py-2.5 text-base font-normal focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Top K Documents
        <input
          type="number"
          value={values.topK}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, topK: Number(event.target.value) }))
          }
          className="rounded-lg border border-indigo-200 px-3.5 py-2.5 text-base font-normal focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm text-slate-700">
        Max Words
        <input
          type="number"
          value={values.maxWords}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              maxWords: Number(event.target.value),
            }))
          }
          className="rounded-lg border border-indigo-200 px-3.5 py-2.5 text-base font-normal focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </label>
      <label className="col-span-full flex flex-col gap-2 text-sm text-slate-700">
        Welcome Message
        <textarea
          value={values.welcomeText}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, welcomeText: event.target.value }))
          }
          className="min-h-[120px] resize-y rounded-lg border border-indigo-200 px-3.5 py-2.5 text-base font-normal focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/20"
        />
      </label>
      <button
        type="submit"
        className="col-span-full cursor-pointer justify-self-end rounded-full border-none bg-primary-600 px-6 py-2.5 text-base font-semibold text-white hover:bg-primary-700"
      >
        Save Settings
      </button>
    </form>
  );
};

export default SettingsForm;
