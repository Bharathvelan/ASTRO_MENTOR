'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { GraduationCap, Lightbulb } from 'lucide-react';

export default function LearningSettings() {
  const { toast } = useToast();
  const { skillLevel, socraticMode, hintDetail, setSkillLevel, setSocraticMode, setHintDetail } = useSettingsStore();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your learning preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <GraduationCap className="inline h-5 w-5 mr-2" />
            Skill Level
          </CardTitle>
          <CardDescription>
            Set your programming skill level to receive appropriate guidance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setSkillLevel(level)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  skillLevel === level
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium capitalize">{level}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {level === 'beginner' && 'Detailed explanations'}
                  {level === 'intermediate' && 'Balanced guidance'}
                  {level === 'advanced' && 'Concise hints'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Lightbulb className="inline h-5 w-5 mr-2" />
            Socratic Mode
          </CardTitle>
          <CardDescription>
            Enable progressive hints instead of direct answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Socratic Mode</Label>
              <p className="text-sm text-muted-foreground">
                Get hints progressively instead of immediate solutions
              </p>
            </div>
            <button
              onClick={() => setSocraticMode(!socraticMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                socraticMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  socraticMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hint Detail Level</CardTitle>
          <CardDescription>
            Control how detailed the hints should be
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Less detailed</span>
              <span>More detailed</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={hintDetail}
              onChange={(e) => setHintDetail(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="text-center text-sm text-muted-foreground">
              Level: {hintDetail}/5
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
