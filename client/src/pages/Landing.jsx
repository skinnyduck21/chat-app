import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0b14] grid-bg flex flex-col items-center justify-center px-4">

      {/* Icon + wordmark */}
      <div className="fade-in-up text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/25 mb-5">
          <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
            <path
              d="M4 8C4 6.343 5.343 5 7 5H25C26.657 5 28 6.343 28 8V20C28 21.657 26.657 23 25 23H18L12 28V23H7C5.343 23 4 21.657 4 20V8Z"
              fill="#818cf8"
              opacity="0.85"
            />
            <circle cx="11" cy="14" r="1.5" fill="white" opacity="0.65" />
            <circle cx="16" cy="14" r="1.5" fill="white" opacity="0.65" />
            <circle cx="21" cy="14" r="1.5" fill="white" opacity="0.65" />
          </svg>
        </div>

        <h1 className="text-5xl font-bold text-white tracking-tight mb-3">
          Relay
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto leading-relaxed">
          Real-time group chat. Fast, simple, no noise.
        </p>
      </div>

      {/* CTAs */}
      <div className="fade-in-up-1 flex flex-col sm:flex-row gap-3">
        <Link
          to="/signup"
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Create account
        </Link>
        <Link
          to="/login"
          className="px-8 py-3 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl border border-white/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center"
        >
          Sign in
        </Link>
      </div>

      <p className="fade-in-up-2 mt-10 text-slate-600 text-sm">
        Relay Chat · Version 1.0.0
      </p>
    </div>
  );
}