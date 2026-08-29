'use client';

import React, { useState } from 'react';
import { searchEmails } from '@/lib/api';
import { Search, Loader2, Database, Mail } from 'lucide-react';
import { Input } from './UI/Input';
import { Button } from './UI/Button';
import { formatDate } from '@/lib/utils';

export const SearchSection: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setIsSearching(true);
      setHasSearched(true);
      const res = await searchEmails(query);
      setResults(res);
    } catch (err) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-slate-100 flex items-center text-base">
            <Database className="w-4 h-4 mr-2 text-indigo-400" /> Full-Text Elasticsearch Search
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Queries the official Elasticsearch cluster for matching recipients, subjects, bodies, or status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search leads, subjects, email content, or status..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Button type="submit" isLoading={isSearching} icon={<Search className="w-4 h-4" />}>
          Search
        </Button>
      </form>

      {/* Results Display */}
      {isSearching ? (
        <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-400" /> Searching Elasticsearch index...
        </div>
      ) : hasSearched && results.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          No matching records found in Elasticsearch index for "{query}".
        </div>
      ) : results.length > 0 ? (
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Match To</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Scheduled / Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {results.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono font-medium text-slate-200">{item.to}</td>
                  <td className="py-3 px-4 font-medium">{item.subject}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {formatDate(item.sentAt || item.scheduledAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};
