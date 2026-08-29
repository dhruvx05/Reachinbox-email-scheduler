import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Send } from 'lucide-react';

interface StatsOverviewProps {
  stats: {
    scheduled: number;
    sent: number;
    failed: number;
    total: number;
  };
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Scheduled Queue',
      value: stats.scheduled,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: 'hover:border-amber-500/50 hover:shadow-amber-500/10',
    },
    {
      title: 'Successfully Sent',
      value: stats.sent,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
    },
    {
      title: 'Failed Sends',
      value: stats.failed,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      glow: 'hover:border-red-500/50 hover:shadow-red-500/10',
    },
    {
      title: 'Total Processed',
      value: stats.total,
      icon: Send,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 rounded-2xl glass-card ${card.border} ${card.glow} flex items-center justify-between shadow-xl relative overflow-hidden group`}
          >
            <div className="min-w-0 flex-1 mr-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {card.title}
              </p>
              <h4 className="text-3xl font-black text-white mt-1 tracking-tight">
                {card.value}
              </h4>
            </div>
            <div
              className={`p-3.5 rounded-xl ${card.bg} border ${card.border} flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
            >
              <Icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
