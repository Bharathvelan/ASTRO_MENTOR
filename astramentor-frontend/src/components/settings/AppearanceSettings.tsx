'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUIStore } from '@/lib/stores/ui-store';
import { Moon, Sun, Monitor, Palette } from 'lucide-react';

export default function AppearanceSettings() {
  const { toast } = useToast();
  const { theme, setTheme } = useUIStore();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your appearance preferences have been updated.',
    });
  };

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun, description: 'Light mode' },
    { value: 'dark' as const, label: 'Dark', icon: Moon, description: 'Dark mode' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Palette className="inline h-5 w-5 mr-2" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              return (
                <button
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={`p-6 rounded-lg border-2 transition-all ${
                    theme === themeOption.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon className="h-8 w-8 mx-auto mb-3" />
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {themeOption.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Color Scheme</CardTitle>
          <CardDescription>
            Customize your color preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm font-medium mb-2">Primary Color</div>
              <div className="flex gap-2">
                <div className="w-10 h-10 rounded-lg bg-[#6C63FF] border-2 border-primary" />
                <div className="w-10 h-10 rounded-lg bg-[#00D4AA] border-2 border-transparent hover:border-primary cursor-pointer" />
                <div className="w-10 h-10 rounded-lg bg-[#FF6B6B] border-2 border-transparent hover:border-primary cursor-pointer" />
                <div className="w-10 h-10 rounded-lg bg-[#4ECDC4] border-2 border-transparent hover:border-primary cursor-pointer" />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Custom color schemes coming soon
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
