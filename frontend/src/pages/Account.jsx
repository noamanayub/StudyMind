import { useState } from "react";
import { Camera, ShieldCheck, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, errorMessage } from "../services/api";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import { ErrorNotice } from "../components/common/Feedback";
import PreferencesForm from "../components/study/PreferencesForm";
export default function Account({ settings = false }) {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [avatar, setAvatar] = useState(user.avatarUrl),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  function image(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 140000
    ) {
      setError("Choose a PNG, JPEG, or WebP image under 140 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result);
      setError("");
    };
    reader.readAsDataURL(file);
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = e.currentTarget;
    try {
      const values = Object.fromEntries(new FormData(form));
      if (settings) {
        await api.patch("/users/me/password", values);
        form.reset();
        toast("Password updated. Other sessions are signed out.");
      } else {
        const response = await api.patch("/users/me", {
          name: values.name,
          avatarUrl: avatar,
        });
        setUser(response.data.data);
        toast("Profile updated.");
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeader
        eyebrow={
          settings ? "MAKE YOURSELF AT HOME" : "THE MIND BEHIND THE MATERIAL"
        }
        title={settings ? "Settings" : "Your profile"}
        description={
          settings
            ? "A few essentials for your personal study space."
            : "A little about you and your learning journey."
        }
      />
      <div className="account-grid">
        <section className="account-panel">
          <div className="section-title">
            <h2>{settings ? "Account security" : "Personal details"}</h2>
            {settings ? <ShieldCheck size={22} /> : <BookOpen size={22} />}
          </div>
          {error && <ErrorNotice message={error} />}
          <form onSubmit={submit} key={settings ? "settings" : "profile"}>
            {settings ? (
              <>
                <Input
                  label="Current password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                />
                <Input
                  label="New password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={72}
                  required
                  help="At least 10 characters."
                />
                <Input
                  label="Confirm new password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  minLength={10}
                  maxLength={72}
                  required
                />
              </>
            ) : (
              <>
                <div className="profile-avatar-row">
                  <span className="profile-avatar">
                    {avatar ? (
                      <img src={avatar} alt="Your profile" />
                    ) : (
                      user.name[0]
                    )}
                  </span>
                  <label className="button button-secondary avatar-upload">
                    <Camera size={16} />
                    Change photo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={image}
                    />
                  </label>
                  {avatar && (
                    <button
                      className="text-button"
                      type="button"
                      onClick={() => setAvatar(null)}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Input
                  label="Full name"
                  name="name"
                  defaultValue={user.name}
                  minLength={2}
                  maxLength={100}
                  required
                  autoComplete="name"
                />
                <Input
                  label="Email address"
                  defaultValue={user.email}
                  readOnly
                  help="Email changes are not available in this version."
                />
                <p className="form-note">
                  Part of Study Mind since{" "}
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    dateStyle: "long",
                  })}
                  .
                </p>
              </>
            )}
            <Button loading={busy} type="submit">
              {settings ? "Update password" : "Save changes"}
            </Button>
          </form>
        </section>
        <aside className="account-aside">
          <ShieldCheck size={28} />
          <h2>
            Your knowledge,
            <br />
            your space.
          </h2>
          <p>
            Only your account can access your documents, workspaces, and
            conversations.
          </p>
          <p>
            When you upload material or ask a question, relevant text is sent to
            Gemini for embeddings and answers.
          </p>
          <p>
            You can delete documents, workspaces, and conversations from their
            own pages.
          </p>
        </aside>
      </div>
      {settings && <PreferencesForm />}
    </>
  );
}
