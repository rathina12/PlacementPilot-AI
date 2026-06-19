"use client";

import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/ui/DashboardLayout";
import { ScoreRing, SectionHeader, LoadingSpinner, EmptyState } from "@/components/ui";
import { interviewsAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Video, Send, RefreshCw, CheckCircle, AlertCircle,
  Star, TrendingUp, MessageSquare, Clock, Upload,
  Mic, MicOff, StopCircle, Play,
} from "lucide-react";

const ROUND_CONFIG = {
  self_intro: { label: "Self Introduction", color: "bg-blue-100 text-blue-700",   icon: "👤" },
  technical:  { label: "Technical Round",   color: "bg-purple-100 text-purple-700",icon: "💻" },
  hr:         { label: "HR Round",          color: "bg-green-100 text-green-700",  icon: "🤝" },
};

export default function InterviewPage() {
  const [phase,      setPhase]      = useState("select");
  const [roundType,  setRoundType]  = useState(null);
  const [session,    setSession]    = useState(null);
  const [transcript, setTranscript] = useState("");
  const [loading,    setLoading]    = useState(false);
  const [history,    setHistory]    = useState([]);
  const [histLoading,setHistLoading]= useState(true);
  const [inputMode,  setInputMode]  = useState("type"); // "type" | "record" | "upload"

  // Recording state
  const [recording,  setRecording]  = useState(false);
  const [mediaRec,   setMediaRec]   = useState(null);
  const [videoURL,   setVideoURL]   = useState(null);
  const [videoFile,  setVideoFile]  = useState(null);
  const videoRef     = useRef(null);
  const streamRef    = useRef(null);
  const chunksRef    = useRef([]);

  useEffect(() => {
    interviewsAPI.getMySessions()
      .then((r) => setHistory(r.data))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, []);

  // ── Start a round ────────────────────────────────────────────────────────
  const startRound = async (type) => {
    setLoading(true);
    try {
      const res = await interviewsAPI.start(type);
      setSession(res.data);
      setRoundType(type);
      setTranscript("");
      setVideoURL(null);
      setVideoFile(null);
      setPhase("question");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not start interview");
    }
    setLoading(false);
  };

  // ── Video recording ───────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp8,opus" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url  = URL.createObjectURL(blob);
        setVideoURL(url);
        setVideoFile(new File([blob], "interview.webm", { type: "video/webm" }));
        if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.src = url; }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRec(mr);
      setRecording(true);
      toast.success("Recording started!");
    } catch (err) {
      toast.error("Camera/microphone access denied. Please allow access and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRec && recording) {
      mediaRec.stop();
      setRecording(false);
      toast.success("Recording saved! Review it below, then transcribe your answer.");
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setVideoURL(url);
    setVideoFile(file);
    if (videoRef.current) { videoRef.current.src = url; }
    toast.success("Video uploaded! Now type your answer transcript below.");
  };

  // ── Submit answer ─────────────────────────────────────────────────────────
  const submitAnswer = async () => {
    if (!transcript.trim() || transcript.trim().length < 10) {
      toast.error("Please type your answer (at least 10 characters)");
      return;
    }
    setLoading(true);
    setPhase("submitting");
    try {
      const res = await interviewsAPI.submit({
        session_id:         session.id,
        transcript:         transcript.trim(),
        filler_words_count: countFillerWords(transcript),
        speaking_pace_wpm:  estimateWPM(transcript),
      });
      setSession(res.data);
      setPhase("result");
      interviewsAPI.getMySessions().then((r) => setHistory(r.data)).catch(() => {});
    } catch (err) {
      toast.error(err.response?.data?.detail || "Submission failed");
      setPhase("question");
    }
    setLoading(false);
  };

  const reset = () => {
    setPhase("select");
    setSession(null);
    setTranscript("");
    setRoundType(null);
    setVideoURL(null);
    setVideoFile(null);
    setRecording(false);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  return (
    <DashboardLayout requiredRole="student">
      <SectionHeader title="AI Mock Interview" subtitle="Practice and get instant AI-powered feedback" />

      {/* ── Select Round ──────────────────────────────────────────────────── */}
      {phase === "select" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {Object.entries(ROUND_CONFIG).map(([type, cfg]) => (
              <button key={type} onClick={() => startRound(type)} disabled={loading}
                className="card text-left hover:shadow-md transition-all hover:border-indigo-200 border-2 border-transparent group">
                <div className="text-3xl mb-3">{cfg.icon}</div>
                <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 mb-2">{cfg.label}</h3>
                <p className="text-sm text-gray-500">
                  {type === "self_intro" && "Practice your introduction. Scored on clarity, confidence, and structure."}
                  {type === "technical"  && "Explain algorithms or concepts. Evaluated on technical depth."}
                  {type === "hr"         && "Behavioral questions. Scored on communication and confidence."}
                </p>
                <div className="mt-4 text-indigo-600 text-sm font-medium">
                  {loading ? "Starting..." : "Start Round →"}
                </div>
              </button>
            ))}
          </div>

          {/* History */}
          <div className="card">
            <SectionHeader title="Recent Sessions" />
            {histLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : history.length === 0 ? (
              <EmptyState icon={Video} title="No sessions yet" description="Start your first mock interview above" />
            ) : (
              <div className="space-y-3">
                {history.slice(0, 8).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{ROUND_CONFIG[s.session_type]?.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{ROUND_CONFIG[s.session_type]?.label}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs">{s.question}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{s.overall_score?.toFixed(0) || "—"}</p>
                      <p className="text-xs text-gray-400">/ 100</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Question Phase ─────────────────────────────────────────────────── */}
      {phase === "question" && session && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${ROUND_CONFIG[roundType]?.color}`}>
                {ROUND_CONFIG[roundType]?.label}
              </span>
            </div>

            {/* Question */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-5">
              <div className="flex items-start gap-3">
                <MessageSquare className="text-indigo-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-xs font-medium text-indigo-600 mb-1">Interview Question</p>
                  <p className="text-gray-900 font-semibold text-lg leading-relaxed">{session.question}</p>
                </div>
              </div>
            </div>

            {/* Input Mode Tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: "type",   label: "Type Answer", icon: MessageSquare },
                { id: "record", label: "Record Video", icon: Video },
                { id: "upload", label: "Upload Video", icon: Upload },
              ].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setInputMode(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    inputMode === id ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Type Mode */}
            {inputMode === "type" && (
              <div>
                <label className="label">Your Answer</label>
                <textarea className="input min-h-[180px] resize-none"
                  placeholder="Type your answer here... Aim for at least 80 words for a good evaluation."
                  value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {transcript.trim().split(/\s+/).filter(Boolean).length} words
                </p>
              </div>
            )}

            {/* Record Mode */}
            {inputMode === "record" && (
              <div className="space-y-4">
                <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                  <video ref={videoRef} className="w-full h-full object-cover"
                    controls={!!videoURL} muted={recording} playsInline />
                  {!videoURL && !recording && (
                    <div className="absolute flex flex-col items-center gap-2 text-white">
                      <Video size={40} className="opacity-50" />
                      <p className="text-sm opacity-50">Camera preview will appear here</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  {!recording ? (
                    <button onClick={startRecording}
                      className="btn-primary bg-red-600 hover:bg-red-700">
                      <Mic size={16} /> Start Recording
                    </button>
                  ) : (
                    <button onClick={stopRecording}
                      className="btn-primary bg-gray-700 hover:bg-gray-800">
                      <StopCircle size={16} /> Stop Recording
                    </button>
                  )}
                  {videoURL && (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                      <CheckCircle size={14} /> Video ready
                    </span>
                  )}
                </div>
                {videoURL && (
                  <div>
                    <label className="label">Transcribe Your Answer *</label>
                    <p className="text-xs text-gray-400 mb-1">Watch your video and type what you said below</p>
                    <textarea className="input min-h-[120px] resize-none"
                      placeholder="Type what you said in the video..."
                      value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {/* Upload Mode */}
            {inputMode === "upload" && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors">
                  <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium mb-1">Upload your interview video</p>
                  <p className="text-xs text-gray-400 mb-4">MP4, WebM, MOV supported</p>
                  <label className="btn-primary inline-flex cursor-pointer">
                    <Upload size={14} /> Choose Video
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                  </label>
                </div>
                {videoURL && (
                  <div className="space-y-3">
                    <video src={videoURL} controls className="w-full rounded-xl bg-gray-900" />
                    <div>
                      <label className="label">Transcribe Your Answer *</label>
                      <p className="text-xs text-gray-400 mb-1">Watch your video and type what you said</p>
                      <textarea className="input min-h-[120px] resize-none"
                        placeholder="Type what you said in the video..."
                        value={transcript} onChange={(e) => setTranscript(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <div className="flex gap-3 mt-5">
              <button onClick={submitAnswer} className="btn-primary" disabled={loading || !transcript.trim()}>
                <Send size={16} /> Submit for AI Evaluation
              </button>
              <button onClick={reset} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Submitting ─────────────────────────────────────────────────────── */}
      {phase === "submitting" && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner size={40} />
          <p className="text-gray-600 font-medium">Evaluating your response...</p>
          <p className="text-gray-400 text-sm">This takes 5-10 seconds</p>
        </div>
      )}

      {/* ── Result ─────────────────────────────────────────────────────────── */}
      {phase === "result" && session && (
        <div className="max-w-3xl mx-auto space-y-5">
          <div className="card">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="text-green-500" size={24} />
              <h3 className="text-lg font-semibold text-gray-900">Evaluation Complete</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Overall",       score: session.overall_score },
                { label: "Communication", score: session.communication_score },
                { label: "Confidence",    score: session.confidence_score },
                { label: "Content",       score: session.content_quality_score },
              ].map(({ label, score }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <ScoreRing score={score || 0} size={90} strokeWidth={9} />
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              ))}
            </div>
            {session.technical_score != null && (
              <div className="flex items-center gap-3 bg-purple-50 px-4 py-3 rounded-xl mb-4">
                <Star className="text-purple-500" size={18} />
                <p className="text-sm text-purple-700 font-medium">
                  Technical Score: {session.technical_score?.toFixed(0)}/100
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card">
              <h4 className="font-semibold text-green-700 flex items-center gap-2 mb-3">
                <CheckCircle size={16} /> Strengths
              </h4>
              <ul className="space-y-2">
                {(session.strengths || []).map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h4 className="font-semibold text-orange-700 flex items-center gap-2 mb-3">
                <AlertCircle size={16} /> Areas to Improve
              </h4>
              <ul className="space-y-2">
                {(session.improvements || []).map((s, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-orange-400 mt-0.5">→</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {session.detailed_feedback && (
            <div className="card">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <TrendingUp size={16} /> Detailed Feedback
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                {session.detailed_feedback}
              </p>
            </div>
          )}

          {session.sample_answer && (
            <div className="card bg-indigo-50 border border-indigo-100">
              <h4 className="font-semibold text-indigo-800 flex items-center gap-2 mb-3">
                <Star size={16} /> Model Answer
              </h4>
              <p className="text-indigo-900 text-sm leading-relaxed">{session.sample_answer}</p>
            </div>
          )}

          <div className="card">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock size={16} /> Speech Analysis
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Filler Words</p>
                <p className="font-semibold text-gray-800">{session.filler_words_count || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">Speaking Pace</p>
                <p className="font-semibold text-gray-800">
                  {session.speaking_pace_wpm ? `${session.speaking_pace_wpm.toFixed(0)} WPM` : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn-primary">
              <RefreshCw size={16} /> Practice Again
            </button>
            <button onClick={() => setPhase("select")} className="btn-secondary">
              Back to Rounds
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

function countFillerWords(text) {
  const fillers = /\b(um|uh|like|basically|you know|actually|literally|so|well|right)\b/gi;
  return (text.match(fillers) || []).length;
}

function estimateWPM(text, seconds = 120) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / seconds) * 60);
}
