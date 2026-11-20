"use client";

import { api } from "@v1/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  User,
  X,
} from "lucide-react";
import { useState } from "react";

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    name?: string;
    email?: string;
    timezone?: string;
    biography?: string;
  };
}

export function EditInfoModal({
  isOpen,
  onClose,
  initialData,
}: EditInfoModalProps) {
  const updateProfile = useMutation(api.users.updateProfileInfo);

  const [name, setName] = useState(initialData.name || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [timezone, setTimezone] = useState(
    initialData.timezone || "Asia/Kolkata (IST)",
  );
  const [biography, setBiography] = useState(initialData.biography || "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        timezone: timezone.trim(),
        biography: biography.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to update profile";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Edit Info</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-700 border border-emerald-200 font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>Profile updated successfully!</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
              <option value="Asia/Dubai (GST)">Asia/Dubai (GST)</option>
              <option value="Asia/Singapore (SGT)">Asia/Singapore (SGT)</option>
              <option value="Europe/London (GMT/BST)">
                Europe/London (GMT/BST)
              </option>
              <option value="America/New_York (EST/EDT)">
                America/New_York (EST/EDT)
              </option>
              <option value="America/Los_Angeles (PST/PDT)">
                America/Los_Angeles (PST/PDT)
              </option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Biography
            </label>
            <textarea
              rows={3}
              placeholder="Enter your biography"
              value={biography}
              onChange={(e) => setBiography(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
