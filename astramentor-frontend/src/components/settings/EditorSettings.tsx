'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { Code2, Type, WrapText } from 'lucide-react';

export default function EditorSettings() {
  const { toast } = useToast();
  const { editorFontSize, editorTheme, editorTabSize, editorWordWrap, setEditorFontSize, setEditorTheme, setEditorTabSize, setEditorWordWrap } = useSettingsStore();

  const handleSave = () => {
    toast({
      title: 'Settings saved',
      description: 'Your editor preferences have been updated.',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Type className="inline h-5 w-5 mr-2" />
            Font Size
          </CardTitle>
          <CardDescription>
            Adjust the editor font size
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {[12, 14, 16, 18, 20].map((size) => (
              <button
                key={size}
                onClick={() => setEditorFontSize(size)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  editorFontSize === size
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{size}px</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Code2 className="inline h-5 w-5 mr-2" />
            Editor Theme
          </CardTitle>
          <CardDescription>
            Choose your preferred editor color scheme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(['vs-dark', 'vs-light', 'hc-black'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => setEditorTheme(theme)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  editorTheme === theme
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">
                  {theme === 'vs-dark' && 'Dark'}
                  {theme === 'vs-light' && 'Light'}
                  {theme === 'hc-black' && 'High Contrast'}
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tab Size</CardTitle>
          <CardDescription>
            Set the number of spaces for indentation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[2, 4, 8].map((size) => (
              <button
                key={size}
                onClick={() => setEditorTabSize(size)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  editorTabSize === size
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="font-medium">{size} spaces</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <WrapText className="inline h-5 w-5 mr-2" />
            Word Wrap
          </CardTitle>
          <CardDescription>
            Enable or disable word wrapping in the editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Word Wrap</Label>
              <p className="text-sm text-muted-foreground">
                Wrap long lines to fit the editor width
              </p>
            </div>
            <button
              onClick={() => setEditorWordWrap(!editorWordWrap)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                editorWordWrap ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                  editorWordWrap ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
