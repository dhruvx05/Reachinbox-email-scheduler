'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { StatsOverview } from '@/components/StatsOverview';
import { ScheduledTable } from '@/components/ScheduledTable';
import { SentTable } from '@/components/SentTable';
import { SearchSection } from '@/components/SearchSection';
import { ComposeModal } from '@/components/ComposeModal';
import { Button } from '@/components/UI/Button';
import { fetchEmails, fetchStats, ScheduledEmail } from '@/lib/api';
import { Plus, Clock, CheckCircle, Search, CheckCircle2 } from 'lucide-react';

function DashboardContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'scheduled' | 'sent' | 'search'>('scheduled');
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [sentEmails, setSentEmails] = useState<ScheduledEmail[]>([]);
  const [stats, setStats] = useState({ scheduled: 0, sent: 0, failed: 0, total: 0 });

  const [isLoadingScheduled, setIsLoadingScheduled] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);

  const [slackBanner, setSlackBanner] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const slackParam = searchParams.get('slack');
    if (slackParam === 'connected') {
      setSlackBanner('Slack incoming webhook successfully connected!');
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    try {
      const statsData = await fetchStats();
      setStats(statsData);

      const scheduledList = await fetchEmails('scheduled');
      setScheduledEmails(scheduledList);
      setIsLoadingScheduled(false);

      const sentList = await fetchEmails('sent');
      setSentEmails(sentList);
      setIsLoadingSent(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      loadData();
      const interval = setInterval(loadData, 4000);
      return () => clearInterval(interval);
    }
  }, [status, loadData]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading ReachInbox Session...
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Slack Connection Success Banner */}
        {slackBanner && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between shadow-lg">
            <div className="flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-3 text-emerald-400" />
              <span>{slackBanner}</span>
            </div>
            <button
              onClick={() => setSlackBanner(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center">
              Cold Email Dispatch Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Schedule delayed email campaigns, track live BullMQ execution, and enforce hourly sender rate limits.
            </p>
          </div>

          <Button
            onClick={() => setIsComposeOpen(true)}
            size="lg"
            icon={<Plus className="w-5 h-5" />}
            className="shadow-blue-500/20"
          >
            Compose New Email
          </Button>
        </div>

        {/* System Stats Overview Cards */}
        <StatsOverview stats={stats} />

        {/* Main Dashboard Tabs */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center border-b-2 transition ${
              activeTab === 'scheduled'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" /> Scheduled Queue ({stats.scheduled})
          </button>

          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center border-b-2 transition ${
              activeTab === 'sent'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Sent Log ({stats.sent})
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`pb-3 px-4 text-xs sm:text-sm font-semibold flex items-center border-b-2 transition ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4 mr-2" /> Elasticsearch Search
          </button>
        </div>

        {/* Tab Content Panels */}
        <div>
          {activeTab === 'scheduled' && (
            <ScheduledTable
              emails={scheduledEmails}
              isLoading={isLoadingScheduled}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'sent' && (
            <SentTable emails={sentEmails} isLoading={isLoadingSent} onRefresh={loadData} />
          )}

          {activeTab === 'search' && <SearchSection />}
        </div>
      </main>

      {/* Compose Campaign Modal */}
      <ComposeModal
        isOpen={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
