import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Bell, Send, Users, User, CheckCircle, Info, AlertTriangle, AlertCircle } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { value: 'alert', label: 'Alert', icon: AlertCircle, color: 'text-red-600 bg-red-50 border-red-200' },
];

export default function AdminNotificationsManager() {
  const [mode, setMode] = useState<'broadcast' | 'user'>('broadcast');
  const [form, setForm] = useState({ title: '', message: '', type: 'info' as any, link: '' });
  const [selectedUserId, setSelectedUserId] = useState('');
  const utils = trpc.useUtils();

  const { data: allUsers = [] } = trpc.admin.getAllUsers.useQuery();

  const broadcast = trpc.notifications.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Notification sent to ${data.count} users`);
      setForm({ title: '', message: '', type: 'info', link: '' });
      utils.notifications.getMyNotifications.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const sendToUser = trpc.notifications.sendToUser.useMutation({
    onSuccess: () => {
      toast.success('Notification sent!');
      setForm({ title: '', message: '', type: 'info', link: '' });
      setSelectedUserId('');
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSend = () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (mode === 'broadcast') {
      broadcast.mutate({ title: form.title, message: form.message, type: form.type, link: form.link || undefined });
    } else {
      if (!selectedUserId) { toast.error('Please select a user'); return; }
      sendToUser.mutate({ userId: Number(selectedUserId), title: form.title, message: form.message, type: form.type, link: form.link || undefined });
    }
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type) || TYPE_OPTIONS[0];

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bell size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Send alerts and updates to clients</p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-xl w-fit">
        <button
          onClick={() => setMode('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'broadcast' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Users size={14} />
          All Users
        </button>
        <button
          onClick={() => setMode('user')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'user' ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <User size={14} />
          Specific User
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4 shadow-sm">
        {mode === 'user' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Select Client</label>
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a client...</option>
              {(allUsers as any[]).map((u: any) => (
                <option key={u.id} value={u.id}>{u.name || u.email} {u.name ? `(${u.email})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Title</label>
          <Input
            placeholder="e.g. Important Travel Update"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="rounded-xl"
            maxLength={255}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Message</label>
          <Textarea
            placeholder="Write your notification message here..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            className="rounded-xl resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Type</label>
          <div className="flex gap-2 flex-wrap">
            {TYPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, type: opt.value }))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.type === opt.value ? opt.color + ' shadow-sm' : 'border-border text-muted-foreground hover:bg-muted'}`}
                >
                  <Icon size={11} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Link <span className="text-muted-foreground font-normal">(optional)</span></label>
          <Input
            placeholder="e.g. /dashboard"
            value={form.link}
            onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
            className="rounded-xl"
          />
        </div>

        {/* Preview */}
        {(form.title || form.message) && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Preview</p>
            <div className={`rounded-xl border p-3 ${selectedType.color}`}>
              <p className="text-sm font-semibold">{form.title || 'Notification title'}</p>
              <p className="text-xs mt-0.5 opacity-80">{form.message || 'Notification message'}</p>
            </div>
          </div>
        )}

        <Button
          onClick={handleSend}
          disabled={broadcast.isPending || sendToUser.isPending}
          className="w-full rounded-xl gap-2 btn-gold border-0 text-foreground"
        >
          <Send size={14} />
          {mode === 'broadcast' ? 'Broadcast to All Users' : 'Send to User'}
        </Button>
      </div>

      {/* Recent broadcast history */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Broadcasts</h3>
        <p className="text-xs text-muted-foreground">Broadcasts appear in each client's notification bell after sending.</p>
      </div>
    </div>
  );
}
