import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, BookOpen } from "lucide-react";
import Brand from "../components/common/Brand";
import Companion from "../components/common/Companion";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import { ErrorNotice } from "../components/common/Feedback";
import { useAuth } from "../context/AuthContext";
import { errorMessage } from "../services/api";
export default function Auth({ mode }) {
  const register = mode === "register";
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (user) return <Navigate to="/app" replace />;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    values.rememberMe = form.has("rememberMe");
    try {
      await signIn(mode, values);
      navigate(
        location.state?.from?.startsWith("/app") ? location.state.from : "/app",
        { replace: true },
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-art">
        <Brand />
        <div className="auth-art-content">
          <p className="eyebrow">A SPACE FOR YOUR CURIOUS MIND</p>
          <h2>
            A little less overwhelm.
            <br />A lot more possibility.
          </h2>
          <Companion />
          <p>
            Your lectures, notes, and ideas.
            <br />
            Finally, on the same page.
          </p>
        </div>
        <span className="auth-art-foot">
          <BookOpen size={17} /> Made for the way you learn.
        </span>
      </div>
      <main className="auth-form-section">
        <Link className="text-link back-link" to="/">
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <div className="auth-form-wrap">
          <div className="mobile-only">
            <Brand />
          </div>
          <p className="eyebrow">
            {register
              ? "YOUR NEXT CHAPTER STARTS HERE"
              : "PICK UP WHERE YOU LEFT OFF"}
          </p>
          <h1>{register ? "Hello, curious mind." : "Good to see you."}</h1>
          <p className="muted">
            {register
              ? "Create an account. Make room for understanding."
              : "Your material and your next idea are waiting."}
          </p>
          {error && <ErrorNotice message={error} />}
          <form onSubmit={submit} key={mode}>
            {register && (
              <Input
                label="Full name"
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="What should we call you?"
              />
            )}
            <Input
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={register ? "new-password" : "current-password"}
              required
              minLength={register ? 10 : 1}
              maxLength={72}
              help={
                register ? "At least 10 characters. Make it yours." : undefined
              }
            />
            {register ? (
              <Input
                label="Confirm password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                maxLength={72}
              />
            ) : (
              <label className="checkbox-label">
                <input type="checkbox" name="rememberMe" /> Keep me signed in
              </label>
            )}
            <Button className="full-width" loading={busy} type="submit">
              {register ? "Create my study space" : "Log in"}
              <ArrowUpRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already have a space?" : "New to Study Mind?"}{" "}
            <Link
              onClick={() => setError("")}
              to={register ? "/login" : "/register"}
            >
              {register ? "Log in" : "Create an account"}
            </Link>
          </p>
          <p className="auth-note">
            Your study material stays in your account.
            <br />
            Relevant excerpts are sent to Gemini when you use AI.
          </p>
        </div>
      </main>
    </div>
  );
}
