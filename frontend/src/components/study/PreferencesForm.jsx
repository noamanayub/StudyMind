import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { api, errorMessage } from "../../services/api";
import Button from "../common/Button";
import { ErrorNotice } from "../common/Feedback";
export default function PreferencesForm() {
  const { user, setUser } = useAuth(),
    toast = useToast();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget),
      values = Object.fromEntries(form);
    values.reduceMotion = form.has("reduceMotion");
    try {
      const response = await api.patch("/users/me/preferences", values);
      setUser(response.data.data);
      toast("Your study preferences are saved.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="account-panel preferences-panel">
      <h2>Make it feel like you</h2>
      {error && <ErrorNotice message={error} />}
      <form onSubmit={submit}>
        <fieldset className="study-options" disabled={busy}>
          <legend>AI preferences</legend>
          <label>
            Answer style
            <select name="answerStyle" defaultValue={user.answerStyle}>
              <option value="SHORT">Short</option>
              <option value="BALANCED">Balanced</option>
              <option value="DETAILED">Detailed</option>
            </select>
          </label>
          <label>
            Explanation level
            <select
              name="explanationLevel"
              defaultValue={user.explanationLevel}
            >
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </label>
        </fieldset>
        <p className="muted">
          Applied to future answers and generated study resources. Saved content
          stays as you wrote it.
        </p>
        <fieldset className="study-options" disabled={busy}>
          <legend>Appearance</legend>
          <label>
            Reading text size
            <select name="readingSize" defaultValue={user.readingSize}>
              <option value="DEFAULT">Default</option>
              <option value="LARGE">Large</option>
            </select>
          </label>
          <label>
            Layout density
            <select name="density" defaultValue={user.density}>
              <option value="COMFORTABLE">Comfortable</option>
              <option value="COMPACT">Compact</option>
            </select>
          </label>
        </fieldset>
        <p className="muted">
          Reading size applies to answers, document text and study content.
        </p>
        <label className="preference-checkbox">
          <input
            type="checkbox"
            name="reduceMotion"
            defaultChecked={user.reduceMotion}
          />
          Reduce interface motion
        </label>
        <p className="form-note">
          Your device’s reduced-motion preference is always respected.
        </p>
        <Button type="submit" loading={busy}>
          Save preferences
        </Button>
      </form>
    </section>
  );
}
