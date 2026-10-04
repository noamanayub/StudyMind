import { Link } from "react-router-dom";
import Companion from "../components/common/Companion";
export default function NotFound({ embedded = false }) {
  const Container = embedded ? "section" : "main";
  return (
    <Container className="not-found">
      <Companion decorative />
      <p className="eyebrow">404 · A SMALL DETOUR</p>
      <h1>This page wandered off.</h1>
      <p>Let’s get you back to something worth learning.</p>
      <Link className="button button-primary" to="/">
        Back to Study Mind
      </Link>
    </Container>
  );
}
