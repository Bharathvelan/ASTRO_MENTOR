'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { repositoryApi, type Repository } from '@/lib/api/services';
import {
  FolderGit2, Upload, Github, Loader2, CheckCircle2,
  Trash2, MessageSquare, FileText, Code2, BarChart3,
  ExternalLink, AlertCircle, RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

const SAMPLE_REPOS: Repository[] = [
  {
    id: 'repo-1',
    name: 'react-todo-app',
    description: 'A simple React TODO application with TypeScript and Tailwind CSS',
    language: 'TypeScript',
    file_count: 23,
    line_count: 1847,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'ready',
    github_url: 'https://github.com/user/react-todo-app',
  },
  {
    id: 'repo-2',
    name: 'fastapi-backend',
    description: 'REST API built with FastAPI, SQLAlchemy, and PostgreSQL',
    language: 'Python',
    file_count: 41,
    line_count: 5230,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'ready',
  },
];

const STATUS_CONFIG = {
  ready: { color: 'text-green-600 bg-green-50 border-green-200', icon: CheckCircle2, label: 'Ready' },
  processing: { color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: RefreshCw, label: 'Processing' },
  error: { color: 'text-red-600 bg-red-50 border-red-200', icon: AlertCircle, label: 'Error' },
};

const LANG_COLORS: Record<string, string> = {
  Python: 'text-blue-600',
  TypeScript: 'text-blue-400',
  JavaScript: 'text-yellow-500',
  Java: 'text-orange-500',
  Go: 'text-cyan-500',
  Rust: 'text-red-500',
};

export default function RepositoryPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [repos, setRepos] = useState<Repository[]>(SAMPLE_REPOS);
  const [isUploading, setIsUploading] = useState(false);
  const [githubUrl, setGithubUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    repositoryApi.list().then(data => {
      if (data.length > 0) setRepos(data);
    }).catch(() => {/* use samples */});
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      toast({ title: 'Invalid file', description: 'Please upload a .zip file of your repository', variant: 'destructive' });
      return;
    }
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate progress
    const interval = setInterval(() => {
      setUploadProgress(p => Math.min(p + 15, 90));
    }, 300);

    try {
      const result = await repositoryApi.upload(file);
      setUploadProgress(100);
      setRepos(prev => [{
        id: result.repo_id,
        name: result.name,
        language: 'Unknown',
        file_count: 0,
        line_count: 0,
        created_at: new Date().toISOString(),
        status: result.status,
      }, ...prev]);
      toast({ title: '✅ Repository uploaded!', description: 'AI is now indexing your code.' });
    } catch {
      // Demo: add fake repo
      const fakeRepo: Repository = {
        id: `repo-${Date.now()}`,
        name: file.name.replace('.zip', ''),
        description: 'Uploaded repository — being indexed by AI',
        language: 'Mixed',
        file_count: Math.floor(Math.random() * 50 + 10),
        line_count: Math.floor(Math.random() * 5000 + 500),
        created_at: new Date().toISOString(),
        status: 'processing',
      };
      setRepos(prev => [fakeRepo, ...prev]);
      setUploadProgress(100);
      toast({ title: '📦 Uploaded (Demo)', description: 'Backend not connected — showing demo state.' });
    } finally {
      clearInterval(interval);
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 1000);
    }
  };

  const handleGitHubImport = async () => {
    if (!githubUrl.trim()) return;
    if (!githubUrl.includes('github.com')) {
      toast({ title: 'Invalid URL', description: 'Please enter a valid GitHub repository URL', variant: 'destructive' });
      return;
    }
    setIsImporting(true);
    try {
      const result = await repositoryApi.fromGitHub(githubUrl);
      setRepos(prev => [{
        id: result.repo_id,
        name: result.name,
        language: 'Unknown',
        file_count: 0,
        line_count: 0,
        created_at: new Date().toISOString(),
        status: result.status,
      }, ...prev]);
      setGithubUrl('');
      toast({ title: '🔗 Repository imported!', description: 'Cloning and indexing...' });
    } catch {
      const name = githubUrl.split('/').slice(-2).join('/');
      setRepos(prev => [{
        id: `repo-${Date.now()}`,
        name,
        description: `GitHub: ${githubUrl}`,
        language: 'Mixed',
        file_count: 0,
        line_count: 0,
        created_at: new Date().toISOString(),
        status: 'processing',
        github_url: githubUrl,
      }, ...prev]);
      setGithubUrl('');
      toast({ title: '🔗 Imported (Demo)', description: 'Backend not connected — showing demo state.' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repositoryApi.delete(id);
    } catch {/* demo mode */}
    setRepos(prev => prev.filter(r => r.id !== id));
    toast({ title: 'Repository removed' });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FolderGit2 className="h-8 w-8 text-orange-500" /> Repository Intelligence
        </h1>
        <p className="text-muted-foreground mt-1">
          Upload your codebase and ask the AI anything about it — powered by RAG + Knowledge Graph
        </p>
      </div>

      {/* Upload Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* File Upload */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload Repository
            </CardTitle>
            <CardDescription>Upload a .zip file of your code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop .zip here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">Max 100MB</p>
            </div>

            {isUploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading & indexing...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept=".zip" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
          </CardContent>
        </Card>

        {/* GitHub Import */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Github className="h-4 w-4" /> Import from GitHub
            </CardTitle>
            <CardDescription>Connect a public GitHub repository</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Input
                placeholder="https://github.com/username/repo"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGitHubImport()}
              />
              <Button className="w-full" onClick={handleGitHubImport} disabled={isImporting || !githubUrl}>
                {isImporting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Cloning...</>
                ) : (
                  <><Github className="h-4 w-4 mr-2" />Import Repository</>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The AI will clone, index, and build a knowledge graph of your repository. Ask questions using natural language.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Repository List */}
      <div>
        <h2 className="font-semibold text-lg mb-3">Your Repositories ({repos.length})</h2>
        {repos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FolderGit2 className="h-14 w-14 text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold">No repositories yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Upload a .zip or import from GitHub to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {repos.map((repo) => {
              const statusCfg = STATUS_CONFIG[repo.status];
              const StatusIcon = statusCfg.icon;
              return (
                <Card key={repo.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <FolderGit2 className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{repo.name}</h3>
                          <Badge className={`${statusCfg.color} border text-xs gap-1`}>
                            <StatusIcon className={`h-3 w-3 ${repo.status === 'processing' ? 'animate-spin' : ''}`} />
                            {statusCfg.label}
                          </Badge>
                          {repo.github_url && (
                            <a href={repo.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5">
                              <Github className="h-3 w-3" /><ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{repo.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className={`font-medium ${LANG_COLORS[repo.language] || ''}`}>●&nbsp;{repo.language}</span>
                          <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{repo.file_count} files</span>
                          <span className="flex items-center gap-1"><Code2 className="h-3 w-3" />{repo.line_count.toLocaleString()} lines</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {repo.status === 'ready' && (
                          <>
                            <Link href={`/dashboard/workspace?repo=${repo.id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <MessageSquare className="h-3.5 w-3.5" /> Ask AI
                              </Button>
                            </Link>
                            <Link href={`/dashboard/graph?repo=${repo.id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <BarChart3 className="h-3.5 w-3.5" /> Graph
                              </Button>
                            </Link>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(repo.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
