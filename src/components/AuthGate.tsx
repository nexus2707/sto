import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Building2,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  LogIn,
  CheckCircle2,
  Users,
  Info
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { UserRole } from '../types';

interface AuthGateProps {
  onSuccess?: () => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onSuccess }) => {
  const {
    company,
    branches,
    authorizedUsers,
    loginWithEmail,
    signupWithEmail,
    addAuthorizedUser
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'whitelist'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupBranchId, setSignupBranchId] = useState(branches[0]?.id || 'branch-1');
  const [signupRole, setSignupRole] = useState<UserRole>('creator');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Admin pre-authorization quick add
  const [whitelistEmail, setWhitelistEmail] = useState('');
  const [whitelistName, setWhitelistName] = useState('');
  const [whitelistSuccess, setWhitelistSuccess] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = loginWithEmail(loginEmail);
    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setLoginError(
        result.message ||
          `Email "${loginEmail}" is not in the list of authorized users. Please contact the administrator (hr.rftcom@gmail.com).`
      );
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccess(null);

    const result = signupWithEmail(signupName, signupEmail, signupBranchId, signupRole);
    if (result.success) {
      setSignupSuccess(`Account created & authorized successfully! Redirecting...`);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 700);
    } else {
      setSignupError(result.message || `Access verification failed.`);
    }
  };

  const handleQuickLogin = (email: string) => {
    setLoginEmail(email);
    setLoginError(null);
    const result = loginWithEmail(email);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  const handlePreAuthorizeNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whitelistEmail.trim()) return;

    addAuthorizedUser({
      name: whitelistName.trim() || whitelistEmail.split('@')[0],
      email: whitelistEmail.trim().toLowerCase(),
      role: 'creator',
      assignedBranchId: branches[0]?.id || 'branch-1',
      status: 'active'
    });

    setWhitelistSuccess(`Email "${whitelistEmail}" has been authorized! You can now sign in or register with it.`);
    setWhitelistEmail('');
    setWhitelistName('');
    setTimeout(() => setWhitelistSuccess(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="max-w-xl w-full bg-slate-800/95 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Header Banner */}
        <div className="p-6 pb-5 border-b border-slate-700/80 bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {company.companyName}
              </h1>
              <p className="text-xs text-slate-400">
                Inventory Management & Invoicing System • Staff Authorization Portal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-5 bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>

            <button
              id="auth-tab-signup"
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setSignupError(null);
                setSignupSuccess(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'signup'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>

            <button
              id="auth-tab-whitelist"
              type="button"
              onClick={() => setActiveTab('whitelist')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-center space-x-1.5 cursor-pointer ${
                activeTab === 'whitelist'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Authorized Roster ({authorizedUsers.length})</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Security Policy Reminder Callout */}
          <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-xs text-blue-200 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-blue-300">Access Security & Creator-Only Rule:</span>
              <p className="text-[11px] text-blue-200/80 leading-relaxed">
                The system verifies every email against the pre-approved authorized users whitelist. Once inside, role-based authorization strictly enforces that <strong>only the creator of a stock transfer entry can alter or delete it</strong>.
              </p>
            </div>
          </div>

          {/* TAB 1: LOG IN */}
          {activeTab === 'login' && (
            <div className="space-y-5">
              {loginError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Email Verification Denied</strong>
                    <span className="text-[11px]">{loginError}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Authorized Work Email Address:
                  </label>
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. hr.rftcom@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Enter your registered company email. The system verifies it against the authorized staff whitelist.
                  </span>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <span>Verify Email & Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Select One-Click Demo Profiles */}
              <div className="pt-4 border-t border-slate-700/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Quick Log In as Registered Staff:
                  </span>
                  <span className="text-[10px] text-slate-500">Click to authenticate</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authorizedUsers.slice(0, 4).map(user => (
                    <button
                      key={user.email}
                      type="button"
                      id={`quick-login-${user.id}`}
                      onClick={() => handleQuickLogin(user.email)}
                      className="text-left p-2.5 rounded-lg bg-slate-900/50 hover:bg-slate-700/60 border border-slate-700/60 text-xs flex flex-col justify-between transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-slate-200 group-hover:text-blue-400 truncate">
                          {user.name}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            user.role === 'admin'
                              ? 'bg-blue-900 text-blue-300'
                              : user.role === 'creator'
                              ? 'bg-emerald-900/80 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                        {user.email}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {activeTab === 'signup' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-300 bg-slate-900/40 p-3 rounded-xl border border-slate-700/60">
                <p className="font-semibold text-slate-200 mb-1">
                  Sign up for an inventory management staff account:
                </p>
                <p className="text-[11px] text-slate-400">
                  New registrations are verified against the authorized users whitelist. If your email is pre-approved or invited by the administrator, your account will be activated immediately.
                </p>
              </div>

              {signupError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Registration Verification Failed</strong>
                    <span className="text-[11px]">{signupError}</span>
                  </div>
                </div>
              )}

              {signupSuccess && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Success!</strong>
                    <span className="text-[11px]">{signupSuccess}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name:</label>
                  <input
                    id="signup-name-input"
                    type="text"
                    required
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    placeholder="e.g. Jean-Luc Bakari"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Work Email Address:
                  </label>
                  <input
                    id="signup-email-input"
                    type="email"
                    required
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    placeholder="e.g. j.bakari@rftcom.com"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Will be verified against authorized user list.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Assigned Branch:
                    </label>
                    <select
                      id="signup-branch-select"
                      value={signupBranchId}
                      onChange={e => setSignupBranchId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Role Privilege:
                    </label>
                    <select
                      id="signup-role-select"
                      value={signupRole}
                      onChange={e => setSignupRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="creator">Transfer Creator (Can alter/delete own entries)</option>
                      <option value="staff">Staff (Can create entries, view reports)</option>
                    </select>
                  </div>
                </div>

                <button
                  id="signup-submit-btn"
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-lg shadow-blue-600/20 cursor-pointer mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Verify Authorization & Sign Up</span>
                </button>
              </form>

              {/* Instant Whitelist Simulator for Testing */}
              <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-[11px] text-slate-400">
                <span className="font-bold text-slate-300 block mb-1">Testing Note:</span>
                Testing an unlisted email? If your email is rejected, you can click the{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('whitelist')}
                  className="text-blue-400 underline font-semibold cursor-pointer"
                >
                  Authorized Roster
                </button>{' '}
                tab to pre-authorize your custom email before signing up!
              </div>
            </div>
          )}

          {/* TAB 3: AUTHORIZED ROSTER AUDIT & SIMULATOR */}
          {activeTab === 'whitelist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Authorized User Email Whitelist
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Only these verified emails are permitted to sign up, log in, or manage transfers.
                  </p>
                </div>
              </div>

              {whitelistSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{whitelistSuccess}</span>
                </div>
              )}

              {/* List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {authorizedUsers.map(u => (
                  <div
                    key={u.id}
                    className="p-2.5 bg-slate-900/70 border border-slate-700/60 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {u.email === 'hr.rftcom@gmail.com' && (
                          <span className="text-[9px] font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                            Super Admin
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block">{u.email}</span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          u.role === 'admin'
                            ? 'bg-blue-900 text-blue-300'
                            : u.role === 'creator'
                            ? 'bg-emerald-900/80 text-emerald-300'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                        ● Authorized
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pre-Authorize a custom email for testing */}
              <div className="pt-3 border-t border-slate-700/60">
                <div className="text-xs font-bold text-slate-300 mb-2">
                  Add New Email to Authorized Whitelist:
                </div>
                <form onSubmit={handlePreAuthorizeNew} className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Staff Name"
                      value={whitelistName}
                      onChange={e => setWhitelistName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="email"
                      required
                      placeholder="staff.email@company.com"
                      value={whitelistEmail}
                      onChange={e => setWhitelistEmail(e.target.value)}
                      className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    + Authorize Email for Portal Access
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
