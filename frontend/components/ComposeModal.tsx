'use client';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Modal } from './UI/Modal';
import { Button } from './UI/Button';
import { Input } from './UI/Input';
import { fetchSenders, createSender, scheduleEmailsBatch, Sender } from '@/lib/api';
import { Upload, Users, Clock, AlertCircle, PlusCircle } from 'lucide-react';

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [singleRecipient, setSingleRecipient] = useState('');
  const [csvEmails, setCsvEmails] = useState<string[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('2');
  const [hourlyLimit, setHourlyLimit] = useState('5');

  const [isLoadingSenders, setIsLoadingSenders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New sender creation state
  const [showNewSender, setShowNewSender] = useState(false);
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderEmail, setNewSenderEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSenders();
      // Default start time: current time formatted for datetime-local
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setStartTime(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const loadSenders = async () => {
    try {
      setIsLoadingSenders(true);
      const list = await fetchSenders();
      setSenders(list);
      if (list.length > 0) {
        setSelectedSenderId(list[0].id);
      }
    } catch (err: any) {
      setError('Failed to load senders list.');
    } finally {
      setIsLoadingSenders(false);
    }
  };

  const handleCreateSender = async () => {
    if (!newSenderName || !newSenderEmail) {
      setError('Please provide both name and email for the new sender.');
      return;
    }
    try {
      setError(null);
      const sender = await createSender({ name: newSenderName, email: newSenderEmail });
      setSenders((prev) => [sender, ...prev]);
      setSelectedSenderId(sender.id);
      setShowNewSender(false);
      setNewSenderName('');
      setNewSenderEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create sender.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setError(null);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const detectedEmails: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        results.data.forEach((row: any) => {
          const cells = Array.isArray(row) ? row : Object.values(row);
          cells.forEach((cell: any) => {
            if (typeof cell === 'string') {
              const trimmed = cell.trim();
              if (emailRegex.test(trimmed) && !detectedEmails.includes(trimmed)) {
                detectedEmails.push(trimmed);
              }
            }
          });
        });

        setCsvEmails(detectedEmails);
      },
      error: (err) => {
        setError(`Failed to parse CSV file: ${err.message}`);
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Collect target emails
    let targetEmails: string[] = [];
    if (csvEmails.length > 0) {
      targetEmails = csvEmails;
    } else if (singleRecipient.trim()) {
      targetEmails = [singleRecipient.trim()];
    }

    if (targetEmails.length === 0) {
      setError('Please enter a target recipient email or upload a CSV file with valid leads.');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    if (!body.trim()) {
      setError('Email body is required.');
      return;
    }

    if (!selectedSenderId) {
      setError('Please select an email sender.');
      return;
    }

    try {
      setIsSubmitting(true);
      const baseStartMs = new Date(startTime).getTime();
      const delayMs = Math.max(0, parseInt(delaySeconds, 10) * 1000);

      // Build batch payload with per-email staggered delays
      const batchPayload = targetEmails.map((recipient, index) => {
        const scheduledTime = new Date(baseStartMs + index * delayMs).toISOString();
        return {
          to: recipient,
          subject,
          body,
          senderId: selectedSenderId,
          scheduledAt: scheduledTime,
          tenantId: 'default_tenant',
        };
      });

      await scheduleEmailsBatch(batchPayload);

      // Reset & notify parent
      onSuccess();
      onClose();
      setSubject('');
      setBody('');
      setSingleRecipient('');
      setCsvEmails([]);
      setCsvFileName('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to schedule emails batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compose Cold Email Campaign" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Sender Selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              From Sender
            </label>
            <button
              type="button"
              onClick={() => setShowNewSender(!showNewSender)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center font-medium"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Sender
            </button>
          </div>

          {showNewSender ? (
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3 mb-3">
              <Input
                placeholder="Sender Name (e.g. Alex Rivera)"
                value={newSenderName}
                onChange={(e) => setNewSenderName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Sender Email (e.g. alex@reachinbox.ai)"
                value={newSenderEmail}
                onChange={(e) => setNewSenderEmail(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <Button size="sm" variant="outline" onClick={() => setShowNewSender(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleCreateSender}>
                  Save Sender
                </Button>
              </div>
            </div>
          ) : (
            <select
              value={selectedSenderId}
              onChange={(e) => setSelectedSenderId(e.target.value)}
              disabled={isLoadingSenders}
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {senders.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lead Audience / CSV Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Single Recipient Email"
              type="email"
              placeholder="lead@company.com"
              value={singleRecipient}
              onChange={(e) => setSingleRecipient(e.target.value)}
              disabled={csvEmails.length > 0}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Upload Lead CSV / Text
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="flex items-center justify-center w-full px-3.5 py-2 border border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/40 rounded-lg cursor-pointer text-xs text-slate-300 transition"
              >
                <Upload className="w-4 h-4 mr-2 text-blue-400" />
                {csvFileName ? (
                  <span className="truncate max-w-[140px] text-blue-300">{csvFileName}</span>
                ) : (
                  'Choose CSV File'
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Client-side PapaParse Detected Count Preview */}
        {csvEmails.length > 0 && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-400" />
              <span>
                PapaParse detected <strong>{csvEmails.length}</strong> valid lead email(s) in CSV.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setCsvEmails([]);
                setCsvFileName('');
              }}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Clear
            </button>
          </div>
        )}

        {/* Subject */}
        <Input
          label="Email Subject"
          placeholder="e.g. Scaling your outreach with ReachInbox"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Body */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Email Body Content
          </label>
          <textarea
            rows={5}
            placeholder="Write your email body..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Schedule Timing & Limits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
              Delay Between Sends
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="0"
                value={delaySeconds}
                onChange={(e) => setDelaySeconds(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
              />
              <span className="text-xs text-slate-400">sec</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">
              Hourly Limit
            </label>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                min="1"
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-slate-200"
              />
              <span className="text-xs text-slate-400">/hr</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} icon={<Clock className="w-4 h-4" />}>
            Schedule Batch
          </Button>
        </div>
      </form>
    </Modal>
  );
};
