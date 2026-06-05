// client/src/pages/Chat.jsx  — Phase 5: live Socket.io chat
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useAuth }      from '../context/AuthContext';
import socket           from '../socket';
import api              from '../api/axios';

// ─── Chat Page ─────────────────────────────────────────────────────────────────
export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [messages,     setMessages]     = useState([]);
  const [text,         setText]         = useState('');
  const [onlineCount,  setOnlineCount]  = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [historyError, setHistoryError] = useState('');

  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  // ── Auto-scroll whenever the message list grows ───────────────────────────
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Fetch message history on mount ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/api/messages');
        setMessages(data.messages || []);
      } catch {
        setHistoryError('Could not load message history.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('online_count', (count) => {
      setOnlineCount(count);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message);
      // Server rejects the JWT → force re-login.
      if (err.message.toLowerCase().includes('authentication')) {
        logout();
        navigate('/login');
      }
    });

    return () => {
      socket.off('message');
      socket.off('online_count');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [logout, navigate]);

  // ── Send a message ────────────────────────────────────────────────────────
  const sendMessage = () => {
    const trimmed = text.trim();
    if (!trimmed || !socket.connected) return;
    socket.emit('new_message', { content: trimmed });
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // ── Derive display data ───────────────────────────────────────────────────
  // Group consecutive messages from the same user (within 60 s) to avoid
  // repeating the avatar / username header for every single bubble.
  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1];
    const isGrouped =
      prev &&
      prev.userId === msg.userId &&
      new Date(msg.createdAt) - new Date(prev.createdAt) < 60_000;
    return { ...msg, isGrouped };
  });

  // String comparison handles cases where one side is a number and the other
  // comes from a JWT payload (also a number, but worth being safe).
  const isOwn = (msg) => String(msg.userId) === String(user?.id);

  const fmt = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-[#0a0b14] flex flex-col overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-none h-14 border-b border-[#1f2937] bg-[#0d1117]/90 backdrop-blur-sm flex items-center justify-between px-5 z-10">

        <div className="flex items-center gap-3">
          {/* Logo + wordmark */}
          <div className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
              <path
                d="M4 8C4 6.343 5.343 5 7 5H25C26.657 5 28 6.343 28 8V20C28 21.657 26.657 23 25 23H18L12 28V23H7C5.343 23 4 21.657 4 20V8Z"
                fill="#818cf8" opacity="0.9"
              />
              <circle cx="11" cy="14" r="1.5" fill="white" opacity="0.6" />
              <circle cx="16" cy="14" r="1.5" fill="white" opacity="0.6" />
              <circle cx="21" cy="14" r="1.5" fill="white" opacity="0.6" />
            </svg>
            <span
              className="font-bold text-white text-[15px]"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              Relay
            </span>
          </div>

          {/* Online indicator (hidden on very small screens) */}
          <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-[#1f2937] ml-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs">
              {onlineCount} {onlineCount === 1 ? 'person' : 'people'} online
            </span>
          </div>
        </div>

        {/* User pill + logout */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold select-none">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm hidden sm:inline">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-300 text-xs font-medium transition-colors px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Message area ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-4">

        {loading ? (
          /* Loading spinner */
          <div className="flex items-center justify-center h-full gap-2 text-slate-500 text-sm">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading messages…
          </div>

        ) : historyError ? (
          /* Error state */
          <div className="flex items-center justify-center h-full">
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {historyError}
            </div>
          </div>

        ) : messages.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                <path
                  d="M4 8C4 6.343 5.343 5 7 5H25C26.657 5 28 6.343 28 8V20C28 21.657 26.657 23 25 23H18L12 28V23H7C5.343 23 4 21.657 4 20V8Z"
                  fill="#818cf8" opacity="0.35"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">No messages yet</p>
              <p className="text-slate-600 text-xs mt-1">Be the first to say something 👋</p>
            </div>
          </div>

        ) : (
          /* Message list */
          <div className="max-w-3xl mx-auto flex flex-col">
            {grouped.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                own={isOwn(msg)}
                fmt={fmt}
              />
            ))}
          </div>
        )}

        {/* Invisible anchor — we scrollIntoView this after each new message */}
        <div ref={bottomRef} />
      </main>

      {/* ── Input bar ───────────────────────────────────────────────────── */}
      <footer className="flex-none border-t border-[#1f2937] bg-[#0d1117]/90 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          {/* Auto-sizing textarea wrapper */}
          <div className="flex-1 bg-[#111827] border border-[#1f2937] rounded-xl px-4 py-2.5 transition-colors focus-within:border-indigo-500/60 focus-within:ring-1 focus-within:ring-indigo-500/20">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Message Relay…"
              rows={1}
              className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 text-sm resize-none outline-none leading-relaxed"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!text.trim()}
            aria-label="Send message"
            className="flex-none w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:scale-[1.05] active:scale-[0.95]"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="max-w-3xl mx-auto mt-1.5 text-[11px] text-slate-700 select-none">
          Enter to send · Shift+Enter for new line
        </p>
      </footer>
    </div>
  );
}

// ─── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, own, fmt }) {
  if (own) {
    return (
      <div className={`flex flex-col items-end ${msg.isGrouped ? 'mt-0.5' : 'mt-4'}`}>
        {!msg.isGrouped && (
          <span className="text-[11px] text-slate-600 mb-1 mr-1">
            {fmt(msg.createdAt)}
          </span>
        )}
        <div className="max-w-[70%] bg-indigo-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-sm text-sm leading-relaxed break-words">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2.5 ${msg.isGrouped ? 'mt-0.5' : 'mt-4'}`}>

      {/* Avatar — shown only on the first bubble of a group */}
      {!msg.isGrouped ? (
        <div className="flex-none w-7 h-7 rounded-full bg-slate-700 border border-slate-600/50 flex items-center justify-center text-slate-300 text-xs font-semibold select-none">
          {msg.username?.[0]?.toUpperCase()}
        </div>
      ) : (
        <div className="flex-none w-7" /> /* spacer keeps bubbles aligned */
      )}

      <div className="flex flex-col items-start max-w-[70%]">
        {!msg.isGrouped && (
          <div className="flex items-baseline gap-2 mb-1 ml-0.5">
            <span className="text-xs font-semibold text-slate-300">{msg.username}</span>
            <span className="text-[11px] text-slate-600">{fmt(msg.createdAt)}</span>
          </div>
        )}
        <div className="bg-[#1a2234] border border-[#252d3d] text-slate-200 px-3.5 py-2 rounded-2xl rounded-tl-sm text-sm leading-relaxed break-words">
          {msg.content}
        </div>
      </div>
    </div>
  );
}