import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Mic, Square, Volume2 } from "lucide-react";
import Button from "../common/Button";
export default function VoiceControls({
  onTranscript,
  reply,
  disabled,
  dictationTarget,
}) {
  const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition,
    synthesis = window.speechSynthesis;
  const [listening, setListening] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [status, setStatus] = useState(""),
    [voices, setVoices] = useState(() => synthesis?.getVoices().length || 0),
    recognizer = useRef(null),
    onText = useRef(onTranscript),
    utterances = useRef([]);
  useEffect(() => {
    onText.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    const changed = () => setVoices(synthesis?.getVoices().length || 0);
    synthesis?.addEventListener("voiceschanged", changed);
    return () => {
      synthesis?.removeEventListener("voiceschanged", changed);
      recognizer.current?.abort();
      if (utterances.current.length) synthesis?.cancel();
    };
  }, [synthesis]);
  useEffect(() => {
    if (disabled) recognizer.current?.abort();
  }, [disabled]);
  function dictate() {
    if (listening) {
      recognizer.current?.stop();
      return;
    }
    const recognition = new Recognition();
    recognizer.current = recognition;
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => {
      setListening(true);
      setStatus(
        "Listening. Speak one question, then review the draft before sending.",
      );
    };
    recognition.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++)
        if (e.results[i].isFinal) text += e.results[i][0].transcript + " ";
      if (text.trim()) {
        onText.current(text.trim());
        setStatus("Voice draft ready. Review and send when you are ready.");
      }
    };
    recognition.onerror = (e) => {
      if (e.error !== "aborted")
        setStatus(
          e.error === "not-allowed"
            ? "Microphone access was not granted."
            : e.error === "no-speech"
              ? "No speech was detected. Try again."
              : "Voice dictation could not connect. Please try again.",
        );
    };
    recognition.onend = () => setListening(false);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setStatus("Voice dictation could not start. Please try again.");
    }
  }
  function speak() {
    if (speaking) {
      synthesis.cancel();
      setSpeaking(false);
      utterances.current = [];
      return;
    }
    synthesis.cancel();
    const chunks = reply.match(/[\s\S]{1,900}(?:\s|$)|[\s\S]{1,900}/g) || [];
    utterances.current = chunks.map((text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = navigator.language || "en-US";
      utterance.onerror = () => {
        setSpeaking(false);
        setStatus("Voice playback could not finish.");
      };
      return utterance;
    });
    if (utterances.current.length) {
      utterances.current.at(-1).onend = () => {
        setSpeaking(false);
        utterances.current = [];
      };
      setSpeaking(true);
      utterances.current.forEach((utterance) => synthesis.speak(utterance));
    }
  }
  if (!Recognition && !voices) return null;
  return (
    <div className="voice-controls">
      <div>
        {Recognition && dictationTarget &&
          createPortal(
            <Button
              variant="secondary"
              className="voice-dictate-button"
              disabled={disabled && !listening}
              onClick={dictate}
              aria-label={listening ? "Stop dictation" : "Dictate a question"}
              title={listening ? "Stop dictation" : "Dictate a question"}
            >
              {listening ? <Square size={15} /> : <Mic size={15} />}
            </Button>,
            dictationTarget,
          )}
        {!!voices && reply && (
          <Button variant="secondary" disabled={disabled} onClick={speak}>
            {speaking ? <Square size={15} /> : <Volume2 size={15} />}{" "}
            {speaking ? "Stop reading" : "Read latest reply"}
          </Button>
        )}
      </div>
      {status && <p role="status">{status}</p>}
      {Recognition && (
        <p className="form-note">
          Dictation uses your browser’s recognition service and may send audio
          to that service. Nothing is sent to the Study Agent until you send the
          draft.
        </p>
      )}
    </div>
  );
}
