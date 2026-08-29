import React from 'react';
import { ScheduledEmail } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Clock, RefreshCw, MailSearch } from 'lucide-react';
import { Button } from './UI/Button';

interface ScheduledTableProps {
  emails: ScheduledEmail[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const ScheduledTable: React.FC<ScheduledTableProps> = ({
  emails,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
        <div>
          <h3 className="font-bold text-slate-100 flex items-center text-base">
            <Clock className="w-4 h-4 mr-2 text-amber-400" /> Scheduled Email Queue
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            BullMQ delayed jobs persisted in Redis waiting for execution.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          isLoading={isLoading}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mb-2" />
          Fetching scheduled queue...
        </div>
      ) : emails.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center">
          <MailSearch className="w-10 h-10 text-slate-600 mb-3" />
          <p className="font-semibold text-slate-300">No scheduled emails in queue</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Click "Compose New Email" above to schedule a single cold email or batch upload leads via CSV.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Recipient Email</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Sender</th>
                <th className="py-3.5 px-4">Scheduled Send Time</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {emails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-medium text-slate-200">{email.to}</td>
                  <td className="py-3.5 px-4 font-medium max-w-xs truncate">{email.subject}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {email.sender ? `${email.sender.name}` : email.senderId}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">
                    {formatDate(email.scheduledAt)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        email.status === 'processing'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
