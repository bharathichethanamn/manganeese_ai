import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart3,
  Settings,
  Leaf,
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Navigation & Feedback State
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot'
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Demo Prefill Handler (Mining Analyst Role Only)
  const handleQuickPrefill = () => {
    setEmail('analyst@manganese.ai');
    setPassword('manganese2026');
    setError('');
  };

  // Form Submission Router
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (view === 'login') {
      if (!email.trim()) {
        setError('Please enter your registered email address');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await axios.post('/api/auth/login', {
          email: email.trim(),
          password: password,
        });

        const userData = res.data.user;
        sessionStorage.setItem('mg_authenticated', 'true');
        sessionStorage.setItem('mg_user', JSON.stringify(userData));
        if (rememberMe) {
          localStorage.setItem('mg_authenticated', 'true');
          localStorage.setItem('mg_user', JSON.stringify(userData));
        }
        onLogin(userData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Invalid email or password.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (view === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!email.trim()) {
        setError('Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await axios.post('/api/auth/register', {
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          confirm_password: confirmPassword,
          role: 'Mining Analyst',
        });

        const userData = res.data.user;
        sessionStorage.setItem('mg_authenticated', 'true');
        sessionStorage.setItem('mg_user', JSON.stringify(userData));
        if (rememberMe) {
          localStorage.setItem('mg_authenticated', 'true');
          localStorage.setItem('mg_user', JSON.stringify(userData));
        }
        onLogin(userData);
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to create account.');
      } finally {
        setIsSubmitting(false);
      }
    } else if (view === 'forgot') {
      if (!email.trim()) {
        setError('Please enter your registered email address');
        return;
      }
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMessage(`Password reset link sent to ${email}`);
      }, 700);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Screen Card */}
      <div className="w-full max-w-7xl min-h-[720px] rounded-3xl overflow-hidden shadow-2xl bg-white border border-slate-200/80 grid grid-cols-1 lg:grid-cols-12 relative">
        
        {/* ================= LEFT SIDE: CLEAN OPEN-PIT MINING HERO ================= */}
        <div className="lg:col-span-7 relative flex flex-col justify-between pt-12 px-8 sm:px-12 pb-8 overflow-hidden min-h-[560px] lg:min-h-[720px]">
          {/* Local Pristine Open-Pit Mine Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{
              backgroundImage: `url('/mine_bg.jpg')`,
            }}
          />
          {/* Soft Natural Light Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/95 via-white/70 to-white/30 z-0" />

          {/* Top Header Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center p-2 shadow-md shrink-0">
              <svg className="w-full h-full" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 28L20 4L32 28H8Z" fill="#94A3B8" />
                <path d="M18 28L28 10L38 28H18Z" fill="#2563EB" />
                <path d="M2 28L12 14L22 28H2Z" fill="#3B82F6" />
              </svg>
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight text-slate-900 flex items-center gap-1">
                Manganese<span className="text-blue-600">AI</span>
              </div>
              <div className="text-[11px] font-semibold text-slate-600 tracking-wider uppercase">
                Mining Intelligence & Decision Support
              </div>
            </div>
          </div>

          {/* Hero Content Center */}
          <div className="relative z-10 my-auto py-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight max-w-xl">
              Smarter Mining <br className="hidden sm:inline" />
              for a <span className="text-blue-600">Sustainable</span> Tomorrow
            </h1>
            <p className="mt-4 text-base sm:text-lg text-slate-700 max-w-lg leading-relaxed font-medium">
              AI-powered insights to unlock manganese potential, optimize production and build a greener future.
            </p>

            {/* 4 Clean White Feature Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-8 w-full max-w-2xl">
              <div className="bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl p-4 text-center shadow-lg hover:shadow-xl transition-all group flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  Data-Driven Decisions
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl p-4 text-center shadow-lg hover:shadow-xl transition-all group flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  Higher Productivity
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl p-4 text-center shadow-lg hover:shadow-xl transition-all group flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shrink-0">
                  <Leaf className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  Environmental Intelligence
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-white/90 rounded-2xl p-4 text-center shadow-lg hover:shadow-xl transition-all group flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-800 leading-snug">
                  Risk Mitigation
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Statistics Bar */}
          <div className="relative z-10 mt-auto pt-4">
            <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 text-white rounded-2xl p-4 sm:p-5 grid grid-cols-3 gap-4 text-left shadow-2xl w-full">
              <div className="border-r border-slate-700/60 pr-3">
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">50+</div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">Mining Zones</div>
              </div>
              <div className="border-r border-slate-700/60 px-3">
                <div className="text-xl sm:text-2xl font-bold text-blue-400 tracking-tight">AI Powered</div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">Analysis</div>
              </div>
              <div className="pl-3">
                <div className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight">Sustainable</div>
                <div className="text-xs text-slate-300 font-medium mt-0.5">Mining Future</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: AUTHENTICATION CARD ================= */}
        <div className="lg:col-span-5 bg-white relative pt-12 px-6 sm:px-10 pb-8 flex flex-col justify-between overflow-hidden border-l border-slate-100">
          {/* Subtle Topographic Contour Lines SVG Pattern */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] text-slate-900"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 600 800"
          >
            <path d="M -50,120 Q 150,80 300,160 T 650,140" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -50,220 Q 180,180 350,260 T 650,240" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -50,340 Q 220,300 400,380 T 650,360" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -50,480 Q 250,420 450,520 T 650,490" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -50,620 Q 280,560 480,640 T 650,620" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -50,740 Q 300,680 520,760 T 650,740" fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>

          {/* Top Bar: Need help link */}
          <div className="flex justify-end relative z-10">
            <button
              onClick={() => alert('Support Contact: support@manganese.ai | Hotline: +1 (800) 555-MINE')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              Need help?
            </button>
          </div>

          {/* Center Form Section */}
          <div className="relative z-10 my-auto py-2">
            {/* Logo Header */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2.5 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center p-2 shadow-md">
                  <svg className="w-full h-full" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 28L20 4L32 28H8Z" fill="#64748B" />
                    <path d="M18 28L28 10L38 28H18Z" fill="#2563EB" />
                    <path d="M2 28L12 14L22 28H2Z" fill="#3B82F6" />
                  </svg>
                </div>
                <span className="font-bold text-2xl tracking-tight text-slate-900">
                  Manganese<span className="text-blue-600">AI</span>
                </span>
              </div>
              <div className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase">
                Mining Intelligence & Decision Support
              </div>

              <h2 className="text-2xl font-bold text-slate-900 mt-4">
                {view === 'login' && 'Welcome Back'}
                {view === 'register' && 'Create Your Account'}
                {view === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {view === 'login' && 'Sign in to access your mining intelligence dashboard'}
                {view === 'register' && 'Get started with AI-driven mining analytics'}
                {view === 'forgot' && 'Enter your email to receive a recovery link'}
              </p>
            </div>

            {/* Dedicated Role Badge */}
            {(view === 'login' || view === 'register') && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-2 mb-4 flex items-center justify-center gap-2 text-xs font-bold text-blue-700">
                <User className="w-4 h-4 text-blue-600" />
                <span>Role: Mining Analyst</span>
              </div>
            )}

            {/* Error & Success Notification Banners */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* LOGIN / REGISTER / FORGOT FORM */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Name (Only on Registration) */}
              {view === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex.morgan@manganese.ai"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              {view !== 'forgot' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password (Only on Registration) */}
              {view === 'register' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                    />
                  </div>
                </div>
              )}

              {/* Options Row for Login */}
              {view === 'login' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setError('');
                      setSuccessMessage('');
                    }}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed group mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {view === 'login' && 'Login'}
                      {view === 'register' && 'Create Account'}
                      {view === 'forgot' && 'Send Reset Link'}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Preset Button (Only on Login view) */}
            {view === 'login' && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium text-slate-400">Quick Demo:</span>
                <button
                  type="button"
                  onClick={handleQuickPrefill}
                  className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors cursor-pointer"
                >
                  Prefill Analyst Credentials
                </button>
              </div>
            )}
          </div>

          {/* Bottom Navigation Link */}
          <div className="text-center pt-3 relative z-10">
            {view === 'login' && (
              <p className="text-xs text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('register');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            )}

            {view === 'register' && (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            )}

            {view === 'forgot' && (
              <p className="text-xs text-slate-500">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
