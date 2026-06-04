import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Dummy messages ────────────────────────────────────────────────────────────
//
// Shape intentionally mirrors what Phase 5/6 will produce:
//   { id, userId, username, content, createdAt }
//
// Sentinel IDs for "other" users — large enough not to collide with real DB ids
// (PostgreSQL SERIAL starts at 1 and counts up).
const GHOST_ALEX_ID  = 9001;
const GHOST_PRIYA_ID = 9002;

function buildDummyMessages(myId, myUsername) {
  const t = Date.now();
  return [
    {
      id: 1, userId: GHOST_ALEX_ID, username: 'alex',
      content: 'Hey everyone! Just joined 👋',
      createdAt: new Date(t - 1000 * 60 * 18).toISOString(),
    },
    {
      id: 2, userId: GHOST_PRIYA_ID, username: 'priya',
      content: 'Welcome! Great to have you here 🎉',
      createdAt: new Date(t - 1000 * 60 * 17).toISOString(),
    },
    {
      id: 3, userId: myId, username: myUsername,
      content: "Thanks! I actually built this app from scratch — pretty proud of how it turned out.",
      createdAt: new Date(t - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 4, userId: GHOST_ALEX_ID, username: 'alex',
      content: 'Full-stack with React + Node? Respect. How long did it take you?',
      createdAt: new Date(t - 1000 * 60 * 13).toISOString(),
    },
    {
      id: 5, userId: myId, username: myUsername,
      content: 'About two weeks of evenings. Real-time messaging is the next piece — Socket.io integration coming up.',
      createdAt: new Date(t - 1000 * 60 * 11).toISOString(),
    },
    {
      id: 6, userId: GHOST_PRIYA_ID, username: 'priya',
      content: "WebSockets aren't as scary as they sound. The official Socket.io docs are actually really good.",
      createdAt: new Date(t - 1000 * 60 * 8).toISOString(),
    },
    {
      id: 7, userId: GHOST_PRIYA_ID, username: 'priya',
      content: 'Once you get the basic ping-pong example working, the rest just clicks 😄',
      createdAt: new Date(t - 1000 * 60 * 7).toISOString(),
    },
    {
      id: 8, userId: GHOST_ALEX_ID, username: 'alex',
      content: 'Also — love the dark theme btw. Very easy on the eyes at 2 am 🌙',
      createdAt: new Date(t - 1000 * 60 * 4).toISOString(),
    },
    {
      id: 9, userId: myId, username: myUsername,
      content: 'Glad you like it! Built the whole thing with Tailwind — no component library.',
      createdAt: new Date(t - 1000 * 60 * 2).toISOString(),
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ─── MessageBubble ─────────────────────────────────────────────────────────────
//
// showMeta = true only for the first message in a consecutive run from
// the same sender, so avatars / usernames don't repeat needlessly.

function MessageBubble({ msg, isOwn, showMeta }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>

      {/* Avatar slot — fixed width keeps bubbles aligned even when avatar hidden */}
      <div className="w-7 flex-shrink-0 self-end">
        {!isOwn && showMeta && (
          <div className="w-7 h-7 rounded-full bg-indigo-600/15 border border-indigo-500/20
                          flex items-center justify-center text-indigo-300 text-[11px]
                          font-bold select-none">
            {msg.username[0].toUpperCase()}
          </div>
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-[68%] sm:max-w-[60%]
                       ${isOwn ? 'items-end' : 'items-start'}`}>

        {/* Username — only for others, only at top of run */}
        {!isOwn && showMeta && (
          <span className="text-[11px] text-slate-500 px-1 font-medium tracking-wide">
            {msg.username}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed break-words ${
            isOwn
              ? 'bg-indigo-600 text-white rounded-2xl rounded-br-[4px]'
              : 'bg-[#111827] text-slate-200 border border-[#1f2937] rounded-2xl rounded-bl-[4px]'
          }`}
        >
          {msg.content}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-slate-700 px-1 select-none">
          {formatTime(msg.createdAt)}
        </span>
      </div>
    </div>
  );
}

// ─── Chat page ─────────────────────────────────────────────────────────────────

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  // Phase 5: initialise to [] and populate via GET /api/messages + Socket.io events
  const [messages, setMessages] = useState(
    () => buildDummyMessages(user?.id, user?.username)
  );
  const [input, setInput] = useState('');

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;

    // Phase 5: replace this entire block with:
    //   socket.emit('new_message', { content: text });
    // The server will broadcast back and the socket listener will call setMessages.
    setMessages(prev => [
      ...prev,
      {
        id:        Date.now(),          // Phase 6: real id comes from the DB
        userId:    user.id,
        username:  user.username,
        content:   text,
        createdAt: new Date().toISOString(),
      },
    ]);

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    // Auto-resize up to ~5 lines (120px)
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-[#0a0b14] overflow-hidden">

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      {/*
        grid-cols-[1fr_auto_1fr] gives us three zones:
          left  → brand (left-aligned)
          centre → room info (auto-width, truly centred)
          right → user chip + logout (right-aligned via justify-end)
      */}
      <header className="flex-shrink-0 grid grid-cols-[1fr_auto_1fr] items-center
                         px-4 sm:px-5 h-14 bg-[#0d1117] border-b border-[#1f2937] z-10">

        {/* Left: brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl
                          bg-indigo-600/15 border border-indigo-500/25">
            <svg width="15" height="15" viewBox="0 0 32 32" fill="none">
              <path
                d="M4 8C4 6.343 5.343 5 7 5H25C26.657 5 28 6.343 28 8V20C28 21.657
                   26.657 23 25 23H18L12 28V23H7C5.343 23 4 21.657 4 20V8Z"
                fill="#818cf8" opacity="0.9"
              />
              <circle cx="11" cy="14" r="1.5" fill="white" opacity="0.65" />
              <circle cx="16" cy="14" r="1.5" fill="white" opacity="0.65" />
              <circle cx="21" cy="14" r="1.5" fill="white" opacity="0.65" />
            </svg>
          </div>
          <span
            className="font-bold text-white text-sm tracking-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Relay
          </span>
        </div>

        {/* Centre: room name + online count */}
        <div className="flex items-center gap-2">
          <span className="text-slate-300 text-sm font-medium"># general</span>
          <span className="text-slate-700 text-xs">·</span>
          {/* Phase 5: replace the hardcoded 3 with the live onlineCount state */}
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            3 online
          </span>
        </div>

        {/* Right: current user + logout */}
        <div className="flex items-center gap-2.5 justify-end">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                          bg-white/[0.03] border border-white/[0.06]">
            <div className="w-5 h-5 rounded-full bg-indigo-600/25 border border-indigo-500/30
                            flex items-center justify-center text-indigo-300 text-[10px] font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-xs text-slate-400 max-w-[80px] truncate">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                       bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07]
                       text-slate-400 hover:text-white text-xs font-medium
                       transition-all duration-150"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3
                   3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ─── Messages area ────────────────────────────────────────────────── */}
      {/*
        IMPORTANT: min-h-0 is required here.
        Without it, flex children default to min-height:auto which prevents
        the element from ever shrinking below its content height, so
        overflow-y-auto has nothing to scroll — the whole page scrolls instead.
      */}
      <main className="flex-1 overflow-y-auto min-h-0 px-3 sm:px-5 py-5">
        <div className="max-w-2xl mx-auto">

          {/* Static date divider — Phase 6 can compute this per-day dynamically */}
          <div className="flex items-center gap-3 pb-4">
            <div className="flex-1 h-px bg-[#1f2937]" />
            <span className="text-[10px] uppercase tracking-widest text-slate-600
                             font-medium select-none">
              Today
            </span>
            <div className="flex-1 h-px bg-[#1f2937]" />
          </div>

          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              const isOwn = msg.userId === user?.id;
              // Show avatar + name only at the start of each group
              const showMeta = i === 0 || messages[i - 1].userId !== msg.userId;

              return (
                <div
                  key={msg.id}
                  className={showMeta && i > 0 ? 'pt-3' : 'pt-0.5'}
                >
                  <MessageBubble msg={msg} isOwn={isOwn} showMeta={showMeta} />
                </div>
              );
            })}
          </div>

          {/* Scroll anchor — scrollIntoView targets this */}
          <div ref={bottomRef} className="h-2" />
        </div>
      </main>

      {/* ─── Input bar ────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-3 sm:px-5 py-3.5 bg-[#0d1117] border-t border-[#1f2937]">
        <div className="max-w-2xl mx-auto">

          {/* Wrapper gets the focus ring so clicking anywhere in the bar feels intentional */}
          <div className="flex items-end gap-3 bg-[#111827] border border-[#1f2937]
                          rounded-2xl px-4 py-3
                          focus-within:border-indigo-500/50
                          focus-within:ring-1 focus-within:ring-indigo-500/20
                          transition-all duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Message #general…"
              rows={1}
              className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-600
                         text-sm resize-none focus:outline-none leading-relaxed min-h-[20px]"
              style={{ maxHeight: '120px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              aria-label="Send message"
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl
                         bg-indigo-600 hover:bg-indigo-500
                         disabled:opacity-25 disabled:cursor-not-allowed
                         text-white transition-all duration-150
                         hover:scale-105 active:scale-95 mb-0.5"
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24"
                   stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12
                     59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>

          <p className="mt-1.5 px-1 text-[10px] text-slate-700 select-none">
            <kbd className="font-mono">Enter</kbd> to send ·{' '}
            <kbd className="font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>

    </div>
  );
}