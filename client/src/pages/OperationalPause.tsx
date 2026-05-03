import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export default function OperationalPause({ onUnlock }: { onUnlock?: () => void } = {}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: lastPost } = trpc.admin.getLastFacebookPost.useQuery(
    undefined,
    { enabled: !isUnlocked }
  );

  const handleUnlock = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/verify-pause-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        setError('Incorrect password');
        setLoading(false);
        return;
      }

      const { token } = await response.json();
      localStorage.setItem('pause-token', token);
      setIsUnlocked(true);
      // Notify parent (App.tsx) so it re-renders without redirect
      if (onUnlock) {
        onUnlock();
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleUnlock();
    }
  };

  if (isUnlocked) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Main card */}
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 px-8 py-12">
            <div className="text-center">
              <div className="inline-block mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-amber-300" />
                </div>
              </div>
              <h1 className="text-4xl font-serif text-white mb-2">Operational Pause</h1>
              <p className="text-blue-100">We're temporarily away, preparing something special</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 md:p-12">
            {/* Message */}
            <div className="mb-10">
              <p className="text-slate-700 text-center leading-relaxed mb-6">
                CB Travel is currently on an operational pause. Corron is working on exciting updates and enhancements to bring you an even better luxury travel experience.
              </p>
              <p className="text-slate-600 text-sm text-center italic">
                We'll be back soon with fresh experiences and new possibilities.
              </p>
            </div>

            {/* Last post preview */}
            {lastPost && (
              <div className="mb-10 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Latest from our Facebook
                </h3>
                <div className="space-y-3">
                  <p className="text-slate-800 leading-relaxed text-sm">{lastPost.content}</p>
                  {lastPost.imageUrl && (
                    <img
                      src={lastPost.imageUrl}
                      alt="Facebook post"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                  <p className="text-xs text-slate-500 pt-2">
                    {lastPost.postType?.toUpperCase()} • {new Date(lastPost.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Password gate */}
            <div className="space-y-4">
              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider text-center mb-6">
                Have a password?
              </p>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                  className="w-full px-4 py-3 pr-12 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                  type="button"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                  {error}
                </p>
              )}

              <button
                onClick={handleUnlock}
                disabled={!password || loading}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold rounded-lg hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? 'Unlocking...' : 'Unlock'}
              </button>
            </div>

            {/* Footer */}
            <div className="mt-10 pt-8 border-t border-slate-200">
              <p className="text-xs text-slate-500 text-center">
                Follow us on Facebook for the latest updates<br/>
                <span className="text-amber-600 font-semibold">@CBTravel</span>
              </p>
            </div>
          </div>
        </div>

        {/* Decorative bottom element */}
        <div className="mt-8 text-center">
          <p className="text-blue-200/50 text-sm">CB Travel — Luxury Reimagined</p>
        </div>
      </div>
    </div>
  );
}
