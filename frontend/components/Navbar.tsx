'use client';

import React, { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from './UI/Button';
import { Mail, LogOut, ExternalLink, CheckCircle2, MessageSquare } from 'lucide-react';
import { getSlackStatus } from '@/lib/api';

export const Navbar: React.FC = () => {
  const { data: session } = useSession();
  const [slackConnected, setSlackConnected] = useState(false);
  const [loadingSlack, setLoadingSlack] = useState(true);

  useEffect(() => {
    async function checkSlack() {
      try {
        const data = await getSlackStatus();
        setSlackConnected(data.connected);
      } catch {
        setSlackConnected(false);
      } finally {
        setLoadingSlack(false);
      }
    }
    checkSlack();
  }, []);

  const handleSlackConnect = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    window.location.href = `${backendUrl}/api/auth/slack/connect?tenantId=default_tenant`;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 ring-1 ring-white/20">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-tight text-white">ReachInbox</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping mr-1.5" /> Engine Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Production Cold Email Dispatcher</p>
          </div>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* BullMQ Dashboard Quick Link */}
          <a
            href="http://localhost:5000/admin/queues"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center text-xs font-semibold text-slate-300 hover:text-blue-400 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 px-3.5 py-2 rounded-xl transition duration-200 shadow-sm"
          >
            BullMQ Board <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </a>

          {/* Slack Connect Button */}
          {slackConnected ? (
            <div className="inline-flex items-center text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Slack Connected
            </div>
          ) : (
            <Button
              variant="slack"
              size="sm"
              onClick={handleSlackConnect}
              isLoading={loadingSlack}
              icon={<MessageSquare className="w-3.5 h-3.5" />}
              className="rounded-xl"
            >
              Add to Slack
            </Button>
          )}

          {/* User Info & Logout */}
          {session?.user && (
            <div className="flex items-center space-x-3 pl-3.5 border-l border-slate-800">
              {session.user.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-9 h-9 rounded-full ring-2 ring-blue-500/40 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                  {session.user.name?.[0] || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left text-xs">
                <p className="font-bold text-slate-200">{session.user.name}</p>
                <p className="text-slate-400 truncate max-w-[140px] text-[11px]">{session.user.email}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                title="Logout"
                className="p-2 rounded-xl border-slate-800 hover:border-red-500/40 hover:bg-red-500/10"
              >
                <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400 transition" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
