import { Link } from "react-router-dom";
import Companion from "./Companion";
export default function Brand() {
  return (
    <Link className="brand" to="/" aria-label="Study Mind home">
      <span className="brand-symbol">
        <Companion decorative />
      </span>
      <span>
        study<span className="brand-light">mind</span>
        <span className="brand-period">.</span>
      </span>
    </Link>
  );
}
