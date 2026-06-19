"use client";
import { Toaster } from "react-hot-toast";

// ── Toast Provider (wrap app with this) ────────────────────────────────────
export function ToastProvider() {
  return (
    <Toaster position="top-right" toastOptions={{
      duration: 4000,
      style: { background: "#1f2937", color: "#f9fafb", borderRadius: "12px", fontSize: "14px" },
      success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
      error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
    }} />
  );
}

// ── Score Ring ─────────────────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 120, strokeWidth = 10, label = "" }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, score) / 100) * circumference;
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="score-ring" style={{ transition: "stroke-dashoffset 0.7s ease" }} />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle"
          fontSize={size * 0.22} fontWeight="700" fill={color}>{Math.round(score)}</text>
      </svg>
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  );
}

// ── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = "indigo" }) {
  const map = {
    indigo: "bg-indigo-50 text-indigo-600", success: "bg-green-50 text-green-600",
    warning: "bg-yellow-50 text-yellow-600", danger: "bg-red-50 text-red-600",
    info: "bg-blue-50 text-blue-600", gray: "bg-gray-50 text-gray-600",
  };
  return (
    <div className="card flex items-start gap-4">
      {Icon && <div className={`p-3 rounded-xl ${map[color] || map.indigo}`}><Icon size={22} /></div>}
      <div><p className="text-sm text-gray-500">{label}</p><p className="text-3xl font-bold text-gray-900 mt-1">{value}</p></div>
    </div>
  );
}

// ── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, max = 100, label, showLabel = true, color }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const bg = color || (pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500");
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1 text-xs text-gray-500">
          <span>{label}</span><span className="font-medium">{pct}%</span>
        </div>
      )}
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full progress-bar ${bg}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = "gray" }) {
  const cls = { success:"badge-success", warning:"badge-warning", danger:"badge-danger",
    info:"badge-info", gray:"badge-gray" }[variant] || "badge-gray";
  return <span className={cls}>{children}</span>;
}

// ── Loading Spinner ────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 20, className = "" }) {
  return (
    <svg className={`animate-spin text-indigo-600 ${className}`}
      style={{ width: size, height: size }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Page Loader ────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={40} />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="p-4 bg-gray-100 rounded-full mb-4"><Icon size={32} className="text-gray-400" /></div>}
      <h3 className="text-gray-700 font-semibold text-lg">{title}</h3>
      {description && <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Risk Badge ─────────────────────────────────────────────────────────────
export function RiskBadge({ risk }) {
  if (risk === "low")    return <Badge variant="success">Low Risk</Badge>;
  if (risk === "medium") return <Badge variant="warning">Medium Risk</Badge>;
  return <Badge variant="danger">High Risk</Badge>;
}

// ── Placement Badge ────────────────────────────────────────────────────────
export function PlacementBadge({ status }) {
  const map = { placed:{variant:"success",label:"Placed"}, not_placed:{variant:"danger",label:"Not Placed"},
    not_interested:{variant:"gray",label:"Not Interested"}, in_progress:{variant:"info",label:"In Progress"} };
  const { variant, label } = map[status] || map.in_progress;
  return <Badge variant={variant}>{label}</Badge>;
}

// ── Section Header ─────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = "md" }) {
  if (!open) return null;
  const sizeMap = { sm:"max-w-sm", md:"max-w-md", lg:"max-w-2xl", xl:"max-w-4xl" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full ${sizeMap[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
