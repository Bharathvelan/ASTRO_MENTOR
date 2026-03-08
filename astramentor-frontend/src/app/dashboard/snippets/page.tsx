'use client';

import { useEffect, useState } from 'react';
import { useSnippetStore } from '@/lib/stores/snippet-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Scissors, Search, Plus, Trash2, Copy, Code2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function SnippetsPage() {
  const { snippets, filteredSnippets, fetchSnippets, deleteSnippet, setSearchQuery, searchQuery, isLoading } =
    useSnippetStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    toast({ title: 'Copied!', description: 'Code copied to clipboard.' });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSnippet(id);
      toast({ title: 'Deleted', description: 'Snippet removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete snippet.', variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Code Snippets</h1>
          <p className="text-muted-foreground">Save and reuse your frequently used code</p>
        </div>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Snippet
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search snippets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Snippets Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading snippets...
        </div>
      ) : filteredSnippets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Scissors className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No snippets yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Save code snippets from your chat sessions or create new ones
            </p>
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Create your first snippet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSnippets.map((snippet) => (
            <Card key={snippet.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold line-clamp-1">{snippet.title}</CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {snippet.language}
                  </Badge>
                </div>
                {snippet.description && (
                  <CardDescription className="text-xs line-clamp-2">{snippet.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <pre className="overflow-hidden rounded-md bg-muted p-3 text-xs max-h-28">
                  <code className="line-clamp-5 whitespace-pre-wrap break-all">{snippet.code}</code>
                </pre>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopy(snippet.code, snippet.id)}
                  >
                    {copied === snippet.id ? (
                      'Copied!'
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3 w-3" /> Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(snippet.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {snippet.tags && snippet.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {snippet.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
