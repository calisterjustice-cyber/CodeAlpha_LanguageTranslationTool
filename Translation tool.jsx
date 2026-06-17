import { useState, useCallback } from "react";

const LANGUAGES = [
  { code: "auto", name: "Detect Language" },
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "zh", name: "Chinese (Simplified)" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "yo", name: "Yoruba" },
  { code: "ig", name: "Igbo" },
  { code: "ha", name: "Hausa" },
  { code: "sw", name: "Swahili" },
  { code: "tr", name: "Turkish" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
];

const TARGET_LANGUAGES = LANGUAGES.filter((l) => l.code !== "auto");

export default function TranslationTool() {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("fr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [detectedLang, setDetectedLang] = useState("");
  const [charCount, setCharCount] = useState(0);

  const handleSourceChange = (e) => {
    const val = e.target.value;
    setSourceText(val);
    setCharCount(val.length);
    if (!val) {
      setTranslatedText("");
      setDetectedLang("");
      setError("");
    }
  };

  const translate = useCallback(async () => {
    if (!sourceText.trim()) {
      setError("Please enter some text to translate.");
      return;
    }
    if (sourceLang !== "auto" && sourceLang === targetLang) {
      setError("Source and target languages must be different.");
      return;
    }

    setLoading(true);
    setError("");
    setTranslatedText("");
    setDetectedLang("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a professional language translator. Translate the following text ${
                sourceLang === "auto"
                  ? "(detect the source language automatically)"
                  : `from ${LANGUAGES.find((l) => l.code === sourceLang)?.name}`
              } to ${TARGET_LANGUAGES.find((l) => l.code === targetLang)?.name}.

Return ONLY a JSON object with NO markdown, NO backticks, NO explanation. Format exactly:
{"translation":"<translated text>","detectedLanguage":"<detected language name, or empty string if source was specified>"}

Text to translate:
${sourceText}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const raw = data.content?.find((b) => b.type === "text")?.text || "";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setTranslatedText(parsed.translation || "");
      if (parsed.detectedLanguage) setDetectedLang(parsed.detectedLanguage);
    } catch (err) {
      setError("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sourceText, sourceLang, targetLang]);

  const handleSwap = () => {
    if (sourceLang === "auto") return;
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
    setCharCount(translatedText.length);
    setDetectedLang("");
  };

  const handleCopy = () => {
    if (!translatedText) return;
    navigator.clipboard.writeText(translatedText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleClear = () => {
    setSourceText("");
    setTranslatedText("");
    setError("");
    setDetectedLang("");
    setCharCount(0);
  };

  const handleSpeak = (text, lang) => {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "auto" ? "en" : lang;
    window.speechSynthesis.speak(utter);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoRow}>
          <span style={styles.globeIcon}>🌐</span>
          <div>
            <h1 style={styles.title}>LinguaBridge</h1>
            <p style={styles.subtitle}>AI-Powered Language Translation</p>
          </div>
        </div>
        <div style={styles.badge}>CodeAlpha · Task 1</div>
      </div>

      {/* Language Bar */}
      <div style={styles.langBar}>
        <div style={styles.langGroup}>
          <label style={styles.langLabel}>FROM</label>
          <select
            style={styles.select}
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
          {detectedLang && (
            <span style={styles.detected}>Detected: {detectedLang}</span>
          )}
        </div>

        <button
          style={{
            ...styles.swapBtn,
            opacity: sourceLang === "auto" ? 0.4 : 1,
            cursor: sourceLang === "auto" ? "not-allowed" : "pointer",
          }}
          onClick={handleSwap}
          disabled={sourceLang === "auto"}
          title="Swap languages"
        >
          ⇄
        </button>

        <div style={styles.langGroup}>
          <label style={styles.langLabel}>TO</label>
          <select
            style={styles.select}
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
          >
            {TARGET_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Text Panels */}
      <div style={styles.panels}>
        {/* Source */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelLabel}>Source Text</span>
            <div style={styles.panelActions}>
              <button
                style={styles.iconBtn}
                onClick={() => handleSpeak(sourceText, sourceLang)}
                title="Listen"
              >
                🔊
              </button>
              <button
                style={styles.iconBtn}
                onClick={handleClear}
                title="Clear"
              >
                ✕
              </button>
            </div>
          </div>
          <textarea
            style={styles.textarea}
            placeholder="Type or paste text here…"
            value={sourceText}
            onChange={handleSourceChange}
            maxLength={3000}
          />
          <div style={styles.charCount}>{charCount} / 3000</div>
        </div>

        {/* Target */}
        <div style={{ ...styles.panel, background: "#f0f4ff" }}>
          <div style={styles.panelHeader}>
            <span style={styles.panelLabel}>Translation</span>
            <div style={styles.panelActions}>
              <button
                style={styles.iconBtn}
                onClick={() => handleSpeak(translatedText, targetLang)}
                title="Listen"
                disabled={!translatedText}
              >
                🔊
              </button>
              <button
                style={{
                  ...styles.iconBtn,
                  color: copied ? "#22c55e" : "#6366f1",
                  fontWeight: copied ? 700 : 400,
                }}
                onClick={handleCopy}
                title="Copy"
                disabled={!translatedText}
              >
                {copied ? "✓ Copied" : "📋 Copy"}
              </button>
            </div>
          </div>
          <div style={styles.outputBox}>
            {loading ? (
              <div style={styles.loadingRow}>
                <div style={styles.spinner} />
                <span style={styles.loadingText}>Translating…</span>
              </div>
            ) : translatedText ? (
              <p style={styles.outputText}>{translatedText}</p>
            ) : (
              <p style={styles.placeholder}>Translation will appear here…</p>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && <div style={styles.error}>⚠ {error}</div>}

      {/* Translate Button */}
      <button
        style={{
          ...styles.translateBtn,
          opacity: loading || !sourceText.trim() ? 0.6 : 1,
          cursor: loading || !sourceText.trim() ? "not-allowed" : "pointer",
        }}
        onClick={translate}
        disabled={loading || !sourceText.trim()}
      >
        {loading ? "Translating…" : "Translate →"}
      </button>

      <p style={styles.footer}>
        Supports 20 languages · Auto-detection · Text-to-speech
      </p>
    </div>
  );
}

const styles = {
  page: {
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
    minHeight: "100vh",
    padding: "24px 16px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  globeIcon: { fontSize: 40 },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: 0,
    fontSize: 13,
    color: "#a5b4fc",
    letterSpacing: "0.3px",
  },
  badge: {
    background: "rgba(255,255,255,0.12)",
    color: "#c7d2fe",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 20,
    padding: "4px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.5px",
  },
  langBar: {
    display: "flex",
    alignItems: "flex-end",
    gap: 12,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: "16px 20px",
    marginBottom: 16,
    backdropFilter: "blur(8px)",
    flexWrap: "wrap",
  },
  langGroup: { display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 120 },
  langLabel: { fontSize: 10, fontWeight: 700, color: "#a5b4fc", letterSpacing: "1px" },
  select: {
    background: "rgba(255,255,255,0.15)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 10,
    color: "#fff",
    padding: "10px 12px",
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    outline: "none",
  },
  detected: {
    fontSize: 11,
    color: "#86efac",
    fontStyle: "italic",
    marginTop: 2,
  },
  swapBtn: {
    background: "rgba(99,102,241,0.6)",
    border: "1px solid rgba(165,180,252,0.4)",
    borderRadius: 10,
    color: "#fff",
    fontSize: 22,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s",
    flexShrink: 0,
    alignSelf: "flex-end",
  },
  panels: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 16,
  },
  panel: {
    background: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #e5e7eb",
  },
  panelLabel: { fontSize: 11, fontWeight: 700, color: "#6b7280", letterSpacing: "1px" },
  panelActions: { display: "flex", gap: 8, alignItems: "center" },
  iconBtn: {
    background: "none",
    border: "none",
    fontSize: 14,
    cursor: "pointer",
    color: "#6366f1",
    padding: "4px 6px",
    borderRadius: 6,
  },
  textarea: {
    border: "none",
    outline: "none",
    resize: "none",
    padding: "16px",
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1e1b4b",
    background: "transparent",
    flex: 1,
    minHeight: 180,
    fontFamily: "inherit",
  },
  charCount: {
    textAlign: "right",
    padding: "4px 16px 8px",
    fontSize: 11,
    color: "#9ca3af",
  },
  outputBox: {
    padding: "16px",
    flex: 1,
    minHeight: 180,
    display: "flex",
    alignItems: "flex-start",
  },
  outputText: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: "#1e1b4b",
    whiteSpace: "pre-wrap",
  },
  placeholder: {
    margin: 0,
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  loadingRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#6366f1",
  },
  spinner: {
    width: 20,
    height: 20,
    border: "3px solid #c7d2fe",
    borderTopColor: "#6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { fontSize: 14, color: "#6366f1", fontStyle: "italic" },
  error: {
    background: "rgba(254,226,226,0.15)",
    border: "1px solid rgba(252,165,165,0.4)",
    borderRadius: 10,
    color: "#fca5a5",
    padding: "10px 16px",
    fontSize: 13,
    marginBottom: 12,
  },
  translateBtn: {
    width: "100%",
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 14,
    color: "#fff",
    fontSize: 16,
    fontWeight: 700,
    padding: "16px",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 20px rgba(99,102,241,0.5)",
    marginBottom: 16,
    transition: "transform 0.1s",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(165,180,252,0.7)",
    margin: 0,
    letterSpacing: "0.2px",
  },
};
