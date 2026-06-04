import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#0a0b14] flex items-center justify-center">
      <div className="text-center">
        {/* Avatar */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xl font-bold mb-4">
          {user?.username?.[0]?.toUpperCase()}
        </div>

        <h2 className="text-xl font-bold text-white mb-1">
          Hey, {user?.username}! 👋
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Auth working ✓ — Chat UI coming in Phase 4
        </p>

        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-sm font-medium rounded-xl border border-white/10 transition-all duration-200"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}