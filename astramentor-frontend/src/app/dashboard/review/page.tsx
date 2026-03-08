'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { reviewApi, type ReviewResult } from '@/lib/api/services';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Code2, 
  Loader2, Zap, SearchCode, GitMerge, FileWarning, PlayCircle
} from 'lucide-react';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ReviewPage() {
  const { toast } = useToast();
  const [code, setCode] = useState<string>('# Paste your code here for AI analysis...\n\ndef example():\n    password = "12345"\n    eval("print(password)")\n');
  const [language, setLanguage] = useState<string>('python');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [activeTab, setActiveTab] = useState('summary');

  const handleAnalyze = async () => {
    if (!code.trim()) {
      toast({ title: "Code is empty", description: "Please paste some code to review.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const res = await reviewApi.analyze({
        code,
        language,
      });
      setResult(res);
      toast({
        title: "Analysis Complete",
        description: `Overall Score: ${res.overall_score}/100`,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis Failed",
        description: "An error occurred while analyzing the code.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 border-green-500/20';
    if (score >= 70) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <SearchCode className="h-8 w-8 text-blue-500" />
            AI Code Reviewer
          </h1>
          <p className="text-muted-foreground mt-1">
            Instant feedback on code quality, security vulnerabilities, and performance optimizations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        {/* Left Column: Editor */}
        <Card className="flex flex-col overflow-hidden border-primary/20 shadow-md">
          <CardHeader className="py-3 px-4 border-b bg-card shrink-0 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Code2 className="h-4 w-4 text-blue-500" />
                Source Code
              </CardTitle>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="text-xs bg-muted border rounded py-1 px-2 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
              </select>
            </div>
            <Button 
              size="sm" 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
              ) : (
                <><PlayCircle className="w-4 h-4 mr-2" /> Start Review</>
              )}
            </Button>
          </CardHeader>
          <div className="flex-1 bg-[#1e1e1e]">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                minimap: { enabled: false },
                lineNumbers: 'on',
                padding: { top: 16 },
              }}
            />
          </div>
        </Card>

        {/* Right Column: Results */}
        <Card className="flex flex-col overflow-hidden shadow-md">
           {!result && !isAnalyzing && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center bg-muted/10">
              <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <Shield className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
              <h3 className="text-xl font-medium text-foreground mb-2">Ready for Review</h3>
              <p className="max-w-md mx-auto">
                Paste your code in the editor and click "Start Review". Our AI agent will analyze it for architectural flaws, security risks, and optimization opportunities.
              </p>
            </div>
           )}

           {isAnalyzing && (
             <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/10 space-y-6">
               <div className="relative flex items-center justify-center w-24 h-24">
                 <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
                 <div className="absolute inset-2 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                 <SearchCode className="h-8 w-8 text-blue-500 z-10 animate-pulse" />
               </div>
               <div className="text-center space-y-2">
                 <h3 className="text-lg font-medium">Running Deep Analysis...</h3>
                 <p className="text-sm text-muted-foreground">Checking abstract syntax trees and running heuristic AI detection.</p>
               </div>
             </div>
           )}

           {result && !isAnalyzing && (
             <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
               <CardHeader className="py-0 px-4 pt-4 border-b shrink-0">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 ${getScoreBg(result.overall_score)}`}>
                        <span className={`text-xl font-bold ${getScoreColor(result.overall_score)}`}>{result.overall_score}</span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">Review Complete</h2>
                        <p className="text-sm text-muted-foreground">Found {result.issues.length + result.security_issues.length} total issues.</p>
                      </div>
                    </div>
                 </div>
                 <TabsList className="w-full justify-start bg-transparent border-b rounded-none p-0 h-auto space-x-6">
                   <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2">
                     Overview
                   </TabsTrigger>
                   <TabsTrigger value="security" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2">
                     Security <Badge variant="destructive" className="ml-2 px-1 py-0 h-4 text-[10px]">{result.security_issues.length}</Badge>
                   </TabsTrigger>
                   <TabsTrigger value="issues" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2">
                     Issues <Badge variant="secondary" className="ml-2 px-1 py-0 h-4 text-[10px]">{result.issues.length}</Badge>
                   </TabsTrigger>
                   <TabsTrigger value="suggestions" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 pt-2">
                     Refactors
                   </TabsTrigger>
                 </TabsList>
               </CardHeader>

               <div className="flex-1 overflow-y-auto bg-muted/10 p-4">
                 <TabsContent value="summary" className="m-0 space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Quality', score: result.quality_score },
                        { label: 'Security', score: result.security_score },
                        { label: 'Performance', score: result.performance_score },
                        { label: 'Style', score: result.style_score },
                      ].map(metric => (
                        <div key={metric.label} className="bg-card border rounded-lg p-3 flex flex-col items-center">
                          <span className={`text-lg font-bold ${getScoreColor(metric.score)}`}>{metric.score}</span>
                          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium mt-1">{metric.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-card border rounded-xl overflow-hidden">
                      <div className="bg-muted/50 px-4 py-2 border-b font-medium text-sm flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" /> AI Executive Summary
                      </div>
                      <div className="p-4 text-sm leading-relaxed whitespace-pre-wrap">
                        {result.summary}
                      </div>
                    </div>

                    <div className="bg-card border rounded-xl overflow-hidden p-4">
                       <h4 className="text-sm font-medium mb-3">Code Metrics</h4>
                       <div className="space-y-2 text-sm">
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Lines of Code</span>
                            <span className="font-medium">{result.metrics.lines_of_code}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Cyclomatic Complexity</span>
                            <span className="font-medium">{result.metrics.complexity > 10 ? <span className="text-red-500 flex items-center gap-1">{result.metrics.complexity} (High) <AlertTriangle className="h-3 w-3"/></span> : result.metrics.complexity}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">Maintainability Index</span>
                            <span className="font-medium flex items-center gap-1">{result.metrics.maintainability}/100</span>
                         </div>
                       </div>
                    </div>
                 </TabsContent>

                 <TabsContent value="security" className="m-0 space-y-4">
                   {result.security_issues.length === 0 ? (
                     <div className="text-center p-8 bg-card border rounded-xl border-green-500/20 bg-green-500/5">
                        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3 opacity-80" />
                        <h4 className="font-medium text-green-700 dark:text-green-400">No Security Vulnerabilities Detected</h4>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Your code passed basic security scanning.</p>
                     </div>
                   ) : (
                     result.security_issues.map((issue, idx) => (
                       <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                         <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                             <Shield className="h-4 w-4 text-red-500" />
                             <span className="font-semibold text-red-600 dark:text-red-400 text-sm tracking-wide uppercase">
                               {issue.severity} Risk
                             </span>
                           </div>
                           <Badge variant="outline" className="bg-background text-xs">Line {issue.line}</Badge>
                         </div>
                         <p className="text-sm font-medium mb-2">{issue.message}</p>
                         <div className="bg-card p-3 rounded border text-sm mt-3">
                           <strong className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Remediation:</strong>
                           {issue.remediation}
                         </div>
                         {issue.cve_id && (
                           <div className="mt-3 text-xs font-mono text-muted-foreground bg-background rounded px-2 py-1 inline-block">
                             Ref: {issue.cve_id}
                           </div>
                         )}
                       </div>
                     ))
                   )}
                 </TabsContent>

                 <TabsContent value="issues" className="m-0 space-y-4">
                    {result.issues.length === 0 ? (
                       <div className="text-center p-8 bg-card border rounded-xl border-green-500/20 bg-green-500/5">
                          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3 opacity-80" />
                          <h4 className="font-medium text-green-700 dark:text-green-400">Zero Issues Found</h4>
                          <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">Excellent coding standards!</p>
                       </div>
                    ) : (
                      result.issues.map((issue, idx) => (
                        <div key={idx} className="bg-card border rounded-lg p-4 shadow-sm relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1 h-full ${issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              {issue.severity === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500"/> : <FileWarning className="h-4 w-4 text-blue-500" />}
                              <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{issue.category}</Badge>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Line {issue.line}</span>
                          </div>
                          <p className="text-sm font-medium">{issue.message}</p>
                          {issue.suggestion && (
                             <p className="text-sm text-muted-foreground mt-2 bg-muted/40 p-2 rounded">
                               <strong className="block text-xs uppercase tracking-wider mb-1">Suggestion:</strong>
                               {issue.suggestion}
                             </p>
                          )}
                        </div>
                      ))
                    )}
                 </TabsContent>

                 <TabsContent value="suggestions" className="m-0 space-y-6">
                    {result.suggestions.length === 0 ? (
                       <div className="text-center p-8 bg-card border rounded-xl">
                          <GitMerge className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                          <h4 className="font-medium">No refactoring suggestions.</h4>
                       </div>
                    ) : (
                      result.suggestions.map((sug, idx) => (
                         <div key={idx} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                           <div className="px-4 py-3 border-b bg-muted/40 flex justify-between items-center">
                             <h4 className="font-medium text-sm">{sug.description}</h4>
                             <Badge variant={sug.impact === 'high' ? 'destructive' : sug.impact === 'medium' ? 'default' : 'secondary'}>
                               {sug.impact} impact
                             </Badge>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border-b border-border/50">
                             <div className="bg-[#1e1e1e] p-4 flex flex-col">
                               <span className="text-xs uppercase tracking-wider text-red-400 font-semibold mb-2">Before</span>
                               <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap flex-1">{sug.before}</pre>
                             </div>
                             <div className="bg-[#1e1e1e] p-4 flex flex-col">
                               <span className="text-xs uppercase tracking-wider text-green-400 font-semibold mb-2">After</span>
                               <pre className="text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap flex-1">{sug.after}</pre>
                             </div>
                           </div>
                         </div>
                      ))
                    )}
                 </TabsContent>
               </div>
             </Tabs>
           )}
        </Card>
      </div>
    </div>
  );
}
