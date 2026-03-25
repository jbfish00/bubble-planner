import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';

export function AuthScreen() {
  const { signIn, signUp } = useStore();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === 'signup') {
      setSuccess('Account created! Check your email to confirm, then sign in.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fdf8f5] dark:bg-gray-950 px-6">
      <motion.div
        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-6"
        style={{ background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        B
      </motion.div>

      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Bubble Planner</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Your visual task manager</p>

      {/* Mode tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 rounded-sm p-1 mb-5 w-full max-w-sm">
        {(['signin', 'signup'] as const).map(m => (
          <button
            key={m}
            className="flex-1 py-2 text-sm font-semibold rounded-sm transition-all"
            style={mode === m
              ? { background: '#E8A598', color: '#fff' }
              : { color: '#6b7280' }}
            onClick={() => { setMode(m); setError(''); setSuccess(''); }}
          >
            {m === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-[#E8A598]"
          style={{ padding: '0.75rem 1rem' }}
          required
          autoCapitalize="none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 outline-none focus:border-[#E8A598]"
          style={{ padding: '0.75rem 1rem' }}
          required
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <motion.button
          type="submit"
          className="w-full py-3 rounded-sm text-white font-semibold mt-1"
          style={{ background: '#E8A598', opacity: loading ? 0.6 : 1 }}
          whileTap={{ scale: 0.97 }}
          disabled={loading}
        >
          {loading ? '…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </motion.button>
      </form>
    </div>
  );
}
