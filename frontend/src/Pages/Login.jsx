import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faLock,
  faEnvelope,
  faBolt ,
  faShieldHalved
} from '@fortawesome/free-solid-svg-icons';

import api, { getError } from '../lib/api';
import { saveSession } from '../lib/auth';
import { Toast } from '../components/UI';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', form);
      saveSession(data);
      navigate('/dashboard');
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in and continue building your next level."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Email address
          </label>

          <div className="relative">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
            />

            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-600 transition focus:border-violet-400/50 focus:bg-slate-100 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-xs font-bold uppercase tracking-wider text-slate-400"
          >
            Password
          </label>

          <div className="relative">
            <FontAwesomeIcon
              icon={faLock}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500"
            />

            <input
              id="password"
              type="password"
              required
              minLength="6"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-600 transition focus:border-violet-400/50 focus:bg-slate-100 focus:ring-4 focus:ring-violet-500/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group mt-2 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600" />
              Signing in...
            </>
          ) : (
            <>
              Log in
              <FontAwesomeIcon
                icon={faArrowRight}
                className="text-xs transition group-hover:translate-x-1"
              />
            </>
          )}
        </button>

        <p className="pt-2 text-center text-sm text-slate-500">
          New to Dailygram?{' '}
          <Link
            to="/register"
            className="font-bold text-violet-400 transition hover:text-violet-300"
          >
            Create an account
          </Link>
        </p>
      </form>

      <Toast message={error} onClose={() => setError('')} />
    </AuthShell>
  );
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-5 py-10 text-slate-900 antialiased">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <Link
        to="/"
        className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-400 backdrop-blur-xl transition hover:bg-slate-100 hover:text-slate-900 sm:left-8 sm:top-8"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
        Back to home
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-3"
          >
           

       <span className="text-xl font-black tracking-tight">
              Daily<span className="text-violet-400">gram</span>
            </span>
          </Link>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:p-8">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-300">
              <FontAwesomeIcon icon={faBolt} />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-violet-300">
                Dailygram
              </p>
              <p className="text-[10px] text-slate-600">
                Learn • Connect • Grow
              </p>
            </div>
          </div>

          <div className="mb-7">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {title}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {subtitle}
            </p>
          </div>

          {children}

          <div className="mt-7 flex items-center gap-2 border-t border-slate-200 pt-5 text-[11px] text-slate-600">
            <FontAwesomeIcon icon={faShieldHalved} />
            <span>Your account session is securely authenticated.</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-slate-600">
          Learn with people. Grow with purpose.
        </p>
      </div>
    </div>
  );
}