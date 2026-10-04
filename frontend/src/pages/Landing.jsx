import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  FileText,
  MessageSquare,
  Layers,
  Check,
  Quote,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import Brand from "../components/common/Brand";
import Companion from "../components/common/Companion";
import { useAuth } from "../context/AuthContext";
const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Bring your material.",
    text: "Lecture notes, readings, that one important PDF. Give your knowledge a home.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Make the connections.",
    text: "Study Mind organizes and reads your material, so the right ideas are within reach.",
  },
  {
    number: "03",
    icon: MessageSquare,
    title: "Ask. Understand. Repeat.",
    text: "Explore a question, follow your curiosity, and go back to the source.",
  },
];
export default function Landing() {
  const [menu, setMenu] = useState(false);
  const { user } = useAuth();
  const start = user ? "/app" : "/register";
  return (
    <div className="landing">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="landing-nav page-width">
        <Brand />
        <nav
          className={menu ? "landing-links is-open" : "landing-links"}
          aria-label="Website navigation"
        >
          <a href="#how-it-works" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#your-study-space" onClick={() => setMenu(false)}>
            Your study space
          </a>
          <Link to={user ? "/app" : "/login"}>
            {user ? "My workspace" : "Log in"}
          </Link>
        </nav>
        <Link className="button button-dark nav-cta" to={start}>
          Start studying <ArrowUpRight size={16} />
        </Link>
        <button
          className="icon-button landing-menu"
          onClick={() => setMenu(!menu)}
          aria-expanded={menu}
          aria-label={menu ? "Close menu" : "Open menu"}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main">
        <section className="hero page-width">
          <div className="hero-copy">
            <span className="eyebrow pill">
              <BookOpen size={15} /> A LITTLE HELP. A CLEARER MIND.
            </span>
            <h1>
              Your material.
              <br />A world of
              <br />
              <span>understanding.</span>
            </h1>
            <p>
              Meet the study companion that connects the dots in your lectures,
              notes, and ideas. Less searching. More “now I get it.”
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" to={start}>
                Create your study space <ArrowUpRight size={18} />
              </Link>
              <a className="text-link" href="#how-it-works">
                See how it works <ArrowRight size={16} />
              </a>
            </div>
            <div className="hero-footnote">
              <span>
                <Check size={15} /> Your own material
              </span>
              <span>
                <Check size={15} /> Answers with sources
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="companion-stage">
              <div className="stage-heading">
                <span>MEET YOUR STUDY MIND</span>
                <BookOpen size={22} />
              </div>
              <Companion />
              <div className="stage-caption">
                <span>Hello, curious mind.</span>
                <p>Big questions. Little companion.</p>
              </div>
            </div>
            <div className="hero-question">
              <span className="mini-avatar">You</span>
              <div>
                Can you make this make sense?
                <span>Database lecture · Chapter 03</span>
              </div>
              <ArrowUpRight size={20} />
            </div>
            <div className="hero-answer">
              <span className="answer-icon">
                <BookOpen size={18} />
              </span>
              <div>
                <strong>Let’s figure it out, together.</strong>
                <p>Clear explanations, grounded in your notes.</p>
                <span className="source-pill">
                  <FileText size={12} /> Your lecture, page 12{" "}
                  <Check size={12} />
                </span>
              </div>
            </div>
            <span className="preview-label">ILLUSTRATIVE PRODUCT PREVIEW</span>
          </div>
        </section>
        <section
          className="material-strip page-width"
          aria-label="Supported material"
        >
          <span>A home for all the things you’re learning.</span>
          <div>
            <span>PDFs</span>
            <span>Lecture notes</span>
            <span>Word documents</span>
            <span>Markdown</span>
          </div>
        </section>
        <section id="how-it-works" className="how-section page-width">
          <div className="section-heading">
            <div>
              <p className="eyebrow">FROM INFORMATION TO UNDERSTANDING</p>
              <h2>
                A simpler way
                <br />
                to get there.
              </h2>
            </div>
            <p>
              You bring the curiosity.
              <br />
              We’ll help with the connections.
            </p>
          </div>
          <div className="steps-grid">
            {steps.map(({ number, icon: Icon, title, text }) => (
              <article className="step" key={number}>
                <div className="step-top">
                  <Icon size={24} />
                  <span>{number}</span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="study-section" id="your-study-space">
          <div className="page-width study-grid">
            <div
              className="product-preview"
              aria-label="Illustrative conversation preview"
            >
              <div className="preview-top">
                <Brand />
                <span>PRODUCT PREVIEW</span>
              </div>
              <div className="preview-workspace">
                <BookOpen size={16} /> Database Systems
              </div>
              <div className="preview-user">
                Why do we normalize a database?
              </div>
              <div className="preview-response">
                <span className="answer-icon">
                  <BookOpen size={17} />
                </span>
                <div>
                  <strong>Think of it as giving every fact a home.</strong>
                  <p>
                    Normalization helps you organize information so you don’t
                    have to store the same thing over and over.
                  </p>
                  <span className="source-pill">
                    <FileText size={13} /> Lecture 03.pdf · Page 8
                  </span>
                </div>
              </div>
              <div className="preview-input">
                A little clearer? Keep asking.
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className="study-copy">
              <p className="eyebrow">YOUR NOTES. NOW IN CONVERSATION.</p>
              <h2>
                Not just an answer.
                <br />
                <span>An understanding.</span>
              </h2>
              <p>
                Ask the small questions. Explore the big ones. Your personal
                study space keeps your material and your thinking together.
              </p>
              <ul className="feature-list">
                <li>
                  <Quote size={19} />
                  <div>
                    <strong>Go straight to the source</strong>
                    <span>
                      See which document and passage helped shape an answer.
                    </span>
                  </div>
                </li>
                <li>
                  <Layers size={19} />
                  <div>
                    <strong>A space for every subject</strong>
                    <span>
                      Keep lectures, readings, and conversations connected.
                    </span>
                  </div>
                </li>
                <li>
                  <HistoryIcon />
                  <div>
                    <strong>Pick up where curiosity left off</strong>
                    <span>
                      Your conversations are saved, ready when you are.
                    </span>
                  </div>
                </li>
              </ul>
              <p className="coming-next">
                Summaries, study notes, quizzes, and flashcards — made from your
                material.
              </p>
            </div>
          </div>
        </section>
        <section className="final-cta page-width">
          <BookOpen size={32} />
          <p className="eyebrow">MAKE SPACE FOR YOUR NEXT “AHA.”</p>
          <h2>
            Your notes already hold so much.
            <br />
            Let’s see what you can discover.
          </h2>
          <Link className="button button-primary" to={start}>
            Create your Study Mind <ArrowUpRight size={18} />
          </Link>
          <p>Your material. Your pace. Your space.</p>
        </section>
      </main>
      <footer className="landing-footer page-width">
        <Brand />
        <p>A little more clarity, every day.</p>
        <span>© {new Date().getFullYear()} Study Mind</span>
      </footer>
    </div>
  );
}
function HistoryIcon() {
  return <MessageSquare size={19} />;
}
