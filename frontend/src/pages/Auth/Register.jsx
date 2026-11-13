import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, AlertCircle, FileText, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Register({ onSwitchToLogin }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await signup(email, password, name);
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFE] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="inline-flex w-11 h-11 rounded-xl bg-brand-500 text-white items-center justify-center shadow-sm mb-3">
          <FileText className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold text-content-primary tracking-tight">ApplyMate</h1>
        <p className="mt-1 text-xs text-content-secondary max-w-xs mx-auto">
          Create your career workspace once. Tailor confidently for every opportunity.
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-9 shadow-[0_4px_24px_rgba(39,35,58,0.05)] rounded-2xl border border-app-border">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-content-primary">Create your workspace</h2>
            <p className="text-xs text-content-secondary mt-0.5">
              Set up your master career profile to begin.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50/80 border border-red-200/80 flex items-start gap-2.5 text-xs text-status-danger">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-content-primary mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-app-border focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-all text-content-primary placeholder:text-content-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-content-primary mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-app-border focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-all text-content-primary placeholder:text-content-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-content-primary mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-content-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-app-border focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white transition-all text-content-primary placeholder:text-content-muted"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 active:scale-[0.99] text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-app-border text-center">
            <p className="text-xs text-content-secondary">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-brand-500 hover:text-brand-600 font-semibold transition-colors"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 flex items-center justify-center gap-6 text-[11px] text-content-secondary">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
            <span>ATS-tested formats</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-brand-500" />
            <span>Strict fact provenance</span>
          </div>
        </div>
      </div>
    </div>
  );
}
