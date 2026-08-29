'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Mail, ShieldCheck, Zap, Sparkles, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/UI/Button';

export default function LoginPage() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingDev, setIsLoadingDev] = useState(false);

  const showDevLogin = process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

  const handleGoogleSignIn = () => {
    setIsLoadingGoogle(true);
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleDevSignIn = () => {
    setIsLoadingDev(true);
    signIn('credentials', {
      email: 'alex@reachinbox.ai',
      name: 'Alex Rivera (ReachInbox)',
      callbackUrl: '/dashboard',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-slate-950 text-slate-100">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">ReachInbox Engine</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Production-grade Cold Email Job Scheduler & Dashboard
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="space-y-2.5 mb-6 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
          <div className="flex items-center text-xs text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 mr-2.5 flex-shrink-0" />
            <span>BullMQ Delayed Queueing (Zero Cron Jobs)</span>
          </div>
          <div className="flex items-center text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 mr-2.5 flex-shrink-0" />
            <span>Atomic Redis Sender Rate Limiting</span>
          </div>
          <div className="flex items-center text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-indigo-400 mr-2.5 flex-shrink-0" />
            <span>Full-Text Search with Elasticsearch</span>
          </div>
        </div>

        {/* Login Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleGoogleSignIn}
            isLoading={isLoadingGoogle}
            size="lg"
            className="w-full justify-center py-3.5 bg-white text-slate-900 hover:bg-slate-100 font-semibold border border-slate-200 shadow-lg"
            icon={
              <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            }
          >
            Sign in with Google
          </Button>

          {/* Dev Bypass Option when Google credentials aren't set in local env */}
          {showDevLogin && (
            <div className="pt-3">
              <div className="relative my-3 flex items-center justify-center">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-950 px-2.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold absolute">
                  Local Dev Access
                </span>
              </div>

              <Button
                onClick={handleDevSignIn}
                isLoading={isLoadingDev}
                className="w-full justify-center py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white"
                icon={<LogIn className="w-4 h-4 mr-1.5" />}
              >
                1-Click Direct Access (Bypass OAuth)
              </Button>
              <p className="text-[11px] text-slate-400 text-center mt-2">
                Use 1-Click Access if you haven't added your Google Client ID to <code className="text-blue-400">frontend/.env</code> yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
