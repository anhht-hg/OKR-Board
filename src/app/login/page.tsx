'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, ArrowRight, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { refetch } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (res.ok) {
        await refetch();
        router.push('/');
      } else {
        const d = await res.json();
        setError(d.error || 'Sai tài khoản hoặc mật khẩu');
        setLoading(false);
      }
    } catch (err) {
      setError('Đã xảy ra lỗi kết nối');
      setLoading(false);
    }
  }

  if (!isMounted) return null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-6 overflow-hidden bg-slate-950">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 scale-105 animate-slow-zoom"
        style={{ 
          backgroundImage: 'url("/images/login-bg.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.3) saturate(1.2)'
        }}
      />
      
      {/* Dynamic Gradients */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Brand/Logo Section */}
        <div className="text-center mb-8">
          <div className="relative inline-flex mb-6 group">
            <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
              <span className="text-white text-3xl font-black tracking-tighter">OK</span>
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2 leading-none drop-shadow-2xl">
            OKR <span className="text-blue-400">Board</span>
          </h1>
          <p className="text-blue-200/40 text-[10px] font-bold tracking-[0.3em] uppercase">
            Công nghệ & Vận hành · 2026
          </p>
        </div>

        {/* Login Card (Glassmorphism) */}
        <div className="backdrop-blur-3xl bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.7)] p-10 relative overflow-hidden group">
          {/* Subtle light streak */}
          <div className="absolute -top-[100%] left-0 w-full h-[200%] bg-gradient-to-b from-transparent via-white/[0.02] to-transparent -skew-y-12 transition-transform duration-1000 group-hover:translate-y-[20%] pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em] ml-1">
                Tên đăng nhập
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-blue-400 transition-colors">
                  <User size={18} />
                </div>
                <input 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 outline-none focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 transition-all text-base font-medium"
                  placeholder="admin" 
                  autoComplete="username" 
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-blue-300/40 uppercase tracking-[0.2em] ml-1">
                Mật khẩu
              </label>
              <div className="relative group/input">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within/input:text-blue-400 transition-colors">
                  <Lock size={18} />
                </div>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/[0.05] rounded-2xl pl-12 pr-4 py-4 text-white placeholder:text-white/10 outline-none focus:bg-white/[0.06] focus:border-blue-500/50 focus:ring-8 focus:ring-blue-500/5 transition-all text-base font-medium"
                  placeholder="••••••••" 
                  autoComplete="current-password" 
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium animate-shake">
                <Info size={14} className="shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="group relative w-full bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 rounded-2xl transition-all duration-300 shadow-[0_12px_24px_-8px_rgba(37,99,235,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.7)] disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:translate-y-0 overflow-hidden text-sm uppercase tracking-widest"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[30deg] pointer-events-none" />
              
              <div className="flex items-center justify-center gap-3 relative z-10">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Guest Link */}
          <div className="text-center mt-10 relative z-10">
            <p className="text-[11px] text-white/30 font-medium">
              Hoặc{' '}
              <a href="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30 hover:decoration-blue-400 transition-all">
                Tiếp tục xem ở chế độ chỉ đọc
              </a>
            </p>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center mt-12 opacity-20 hover:opacity-100 transition-opacity duration-1000">
          <p className="text-[9px] text-white font-bold uppercase tracking-[0.4em]">
            Elite OKR Management Portal &bull; Build 2026.4
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slowZoom {
          from { transform: scale(1) rotate(0deg); }
          to { transform: scale(1.15) rotate(1deg); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        .animate-fade-in-up {
          animation: fadeInUp 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        .animate-slow-zoom {
          animation: slowZoom 30s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
        }

        .animate-shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }

        /* Custom Scrollbar for the whole app if needed */
        ::placeholder {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
