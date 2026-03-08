'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Bell, Code2, Shield, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();

  // Profile state
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [preferredLang, setPreferredLang] = useState('python');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [challengeReminders, setChallengeReminders] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [savedProfile, setSavedProfile] = useState(false);

  const handleSaveProfile = () => {
    setSavedProfile(true);
    toast({ title: 'Profile updated successfully!' });
    setTimeout(() => setSavedProfile(false), 3000);
  };

  return (
    <div className="container mx-auto max-w-3xl p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage your account, preferences, and notifications.</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4 text-primary" />
            Profile
          </CardTitle>
          <CardDescription>Update your public display name and view account details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-white font-bold text-xl shrink-0 select-none">
              {(displayName || user?.name || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold">{displayName || user?.name || 'Developer'}</div>
              <div className="text-sm text-muted-foreground">{user?.email || 'user@astramentor.io'}</div>
              <Badge variant="secondary" className="mt-1 text-xs">Free Plan</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              value={user?.email || 'user@astramentor.io'}
              disabled
              className="cursor-not-allowed opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email is managed by your auth provider and cannot be changed here.</p>
          </div>

          <Button onClick={handleSaveProfile} className="gap-2" disabled={savedProfile}>
            {savedProfile ? (
              <><CheckCircle2 className="w-4 h-4 text-green-400" /> Saved!</>
            ) : (
              'Save Profile'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Coding Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Code2 className="w-4 h-4 text-primary" />
            Coding Preferences
          </CardTitle>
          <CardDescription>Set your default language for the Playground and Challenges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="preferred-lang">Preferred Language</Label>
            <select
              id="preferred-lang"
              value={preferredLang}
              onChange={(e) => setPreferredLang(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Control how AstraMentor communicates with you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {([
            {
              id: 'email-notifs',
              label: 'Email Notifications',
              desc: 'Receive weekly learning summaries and tips.',
              value: emailNotifs,
              setter: setEmailNotifs,
            },
            {
              id: 'challenge-reminders',
              label: 'Challenge Reminders',
              desc: "Get reminded when you haven't practiced in 2+ days.",
              value: challengeReminders,
              setter: setChallengeReminders,
            },
            {
              id: 'ai-suggestions',
              label: 'AI Personalized Suggestions',
              desc: 'Let the AI proactively suggest challenges and topics.',
              value: aiSuggestions,
              setter: setAiSuggestions,
            },
          ] as const).map(({ id, label, desc, value, setter }) => (
            <div key={id} className="flex items-center justify-between gap-6">
              <div>
                <Label htmlFor={id} className="font-medium cursor-pointer">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <Switch id={id} checked={value} onCheckedChange={setter} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Shield className="w-4 h-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions — proceed with caution.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Delete Account</div>
              <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data.</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => toast({ title: 'Please contact support to delete your account.', variant: 'destructive' })}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
