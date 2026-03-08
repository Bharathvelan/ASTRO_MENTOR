'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useChatStore } from '@/lib/stores/chat-store';
import { 
  challengesApi, 
  type Challenge, 
  type ChallengeResult 
} from '@/lib/api/services';
import { 
  ArrowLeft, Play, Wand2, Lightbulb, CheckCircle2, 
  XCircle, Clock, FileCode2, Loader2, Maximize2, TerminalIcon
} from 'lucide-react';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export default function ChallengeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { addMessage } = useChatStore();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('python');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHinting, setIsHinting] = useState(false);
  
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [activeTab, setActiveTab] = useState('description');
  const [hintIndex, setHintIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState<string | null>(null);

  useEffect(() => {
    async function loadChallenge() {
      try {
        const data = await challengesApi.get(id);
        setChallenge(data);
        setLanguage(data.language || 'python');
        setCode(data.starter_code || '');
      } catch (err) {
        toast({
          title: "Error loading challenge",
          description: "Could not find the requested challenge.",
          variant: "destructive"
        });
        router.push('/dashboard/challenges');
      } finally {
        setIsLoading(false);
      }
    }
    loadChallenge();
  }, [id, router, toast]);

  const handleSubmit = async () => {
    if (!code.trim() || !challenge) return;
    
    setIsSubmitting(true);
    setActiveTab('test-results');
    setResult(null);

    try {
      const res = await challengesApi.submit({
        challenge_id: challenge.id,
        code,
        language
      });
      
      setResult(res);
      
      if (res.passed) {
        toast({
          title: "🎉 Challenge Solved!",
          description: `You passed all test cases and earned ${res.xp_earned} XP!`,
        });
      } else {
        toast({
          title: "Tests Failed",
          description: "Some test cases did not pass. Check the results panel.",
          variant: "destructive"
        });
      }
    } catch (err) {
      toast({
        title: "Execution Error",
        description: "Failed to run tests on the server.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestSocraticHint = async () => {
    if (!challenge) return;
    
    setIsHinting(true);
    setShowHint(true);
    
    try {
      // Use the smart AI hint endpoint we built
      const res = await challengesApi.getSmartHint(challenge.id, code, language);
      setCurrentHint(res.hint);
    } catch (err) {
      // Fallback to sequential static hints
      try {
        const nextIdx = hintIndex % challenge.hints.length;
        const res = await challengesApi.getHint(challenge.id, nextIdx);
        setCurrentHint(res.hint);
        setHintIndex(nextIdx + 1);
      } catch (fallbackErr) {
        setCurrentHint("Tip: Review the problem description carefully and consider edge cases.");
      }
    } finally {
      setIsHinting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (isLoading || !challenge) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p>Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top Navbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/challenges">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="h-4 w-px bg-border"></div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold">{challenge.title}</h1>
              <Badge variant="outline" className={`text-[10px] h-5 px-1.5 ${getDifficultyColor(challenge.difficulty)}`}>
                {challenge.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-4 hidden sm:flex">
            <Clock className="h-3.5 w-3.5" />
            {challenge.time_limit_minutes}m limit
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
            onClick={requestSocraticHint}
            disabled={isHinting}
          >
            {isHinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-2" />}
            Get AI Hint
          </Button>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Run Tests</>
            )}
          </Button>
        </div>
      </div>

      {/* Split Workspace */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Left Panel: Description & Hints */}
        <div className="w-full lg:w-[45%] flex flex-col border-r bg-background overflow-hidden relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b px-2 bg-muted/20">
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="description" className="data-[state=active]:bg-background data-[state=active]:border-b-primary">
                  Description
                </TabsTrigger>
                <TabsTrigger value="test-results" className="data-[state=active]:bg-background data-[state=active]:border-b-primary">
                  Test Results
                  {result && (
                    <Badge variant={result.passed ? "default" : "destructive"} className="ml-2 px-1 py-0 h-4 text-[10px]">
                      {result.passed ? 'Passed' : 'Failed'}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="description" className="flex-1 overflow-y-auto p-6 m-0 prose prose-sm dark:prose-invert max-w-none">
              <div className="mb-6 flex gap-2">
                <Badge variant="secondary">{challenge.topic}</Badge>
                <Badge variant="outline" className="text-yellow-500 border-yellow-500/20 bg-yellow-500/10">
                  {challenge.xp_reward} XP
                </Badge>
              </div>

              <h3>Problem Statement</h3>
              <div className="whitespace-pre-wrap leading-relaxed text-muted-foreground" dangerouslySetInnerHTML={{__html: challenge.description.replace(/\n/g, '<br/>')}}></div>
              
              <h3 className="mt-8">Examples</h3>
              <div className="space-y-4">
                {challenge.test_cases.filter(tc => !tc.is_hidden).map((tc, idx) => (
                  <div key={tc.id} className="bg-muted/30 border rounded-lg p-4 font-mono text-xs">
                    <div className="font-semibold text-foreground mb-2">Example {idx + 1}: {tc.description}</div>
                    <div className="grid grid-cols-[80px_1fr] gap-2">
                      <div className="text-muted-foreground">Input:</div>
                      <div className="break-all">{tc.input}</div>
                      <div className="text-muted-foreground mt-1">Output:</div>
                      <div className="mt-1 break-all text-green-600 dark:text-green-400">{tc.expected_output}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* AI Hint Panel anchored inside desc */}
              {showHint && currentHint && (
                <div className="mt-8 border border-purple-500/30 bg-purple-500/10 rounded-xl p-5 relative overflow-hidden group transition-all">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-semibold m-0">
                      <Wand2 className="h-4 w-4" /> AI Tutor Hint
                    </h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6 -mt-2 -mr-2" onClick={() => setShowHint(false)}>
                      <XCircle className="h-4 w-4 opacity-50" />
                    </Button>
                  </div>
                  <p className="m-0 text-sm leading-relaxed">{currentHint}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="test-results" className="flex-1 overflow-y-auto p-4 m-0 bg-muted/10">
              {!result ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <TerminalIcon className="h-12 w-12 opacity-20" />
                  <p>Run your code to see test results here.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Results Header */}
                  <div className={`p-4 inset-0 rounded-xl border ${result.passed ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {result.passed ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                      {result.feedback}
                    </h2>
                    {result.passed && (
                      <p className="text-sm mt-2 text-muted-foreground">
                        Excellent work! You earned <strong className="text-yellow-500">{result.xp_earned} XP</strong> for solving this challenge.
                      </p>
                    )}
                  </div>

                  {/* Individual Test Cases */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Test Cases ({result.test_results.length})</h3>
                    {result.test_results.map((tr, idx) => (
                      <div key={idx} className="border rounded-lg bg-card overflow-hidden">
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${tr.passed ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                          <div className="flex items-center gap-3 font-medium">
                            {tr.passed ? 
                              <CheckCircle2 className="h-4 w-4 text-green-500" /> : 
                              <XCircle className="h-4 w-4 text-red-500" />
                            }
                            Case {idx + 1}
                            {challenge.test_cases[idx]?.is_hidden && (
                              <Badge variant="secondary" className="text-[10px]">Hidden Test</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {tr.execution_time_ms}ms
                          </div>
                        </div>
                        
                        {!tr.passed && !challenge.test_cases[idx]?.is_hidden && (
                          <div className="p-4 bg-muted/30 font-mono text-xs space-y-3">
                            <div>
                               <div className="text-muted-foreground mb-1">Input:</div>
                               <div className="p-2 bg-background rounded border">{challenge.test_cases[idx]?.input || "Hidden"}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-muted-foreground mb-1">Expected Output:</div>
                                <div className="p-2 bg-background rounded border text-green-600 dark:text-green-400 break-all">{tr.expected_output}</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground mb-1">Your Output:</div>
                                <div className="p-2 bg-background rounded border text-red-600 dark:text-red-400 break-all whitespace-pre-wrap">{tr.actual_output || "No output"}</div>
                              </div>
                            </div>
                            {tr.error && (
                              <div>
                                <div className="text-red-500 mb-1">Error:</div>
                                <div className="p-2 bg-red-500/10 text-red-600 rounded border border-red-500/20 whitespace-pre-wrap">{tr.error}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {!tr.passed && challenge.test_cases[idx]?.is_hidden && (
                          <div className="p-4 bg-muted/30 font-mono text-xs">
                             <div className="p-2 bg-red-500/10 text-red-600 rounded border border-red-500/20 text-center">
                                Hidden test case failed. Check your edge case logic.
                             </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 flex flex-col min-h-[500px]">
          <div className="bg-card border-b px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">solution.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : 'ts'}</span>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs bg-muted border-none rounded py-1 px-2 cursor-not-allowed opacity-50"
              disabled
              title="This challenge is locked to this language"
            >
               <option value={language}>{language}</option>
            </select>
          </div>
          
          <div className="flex-1">
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
                roundedSelection: false,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                automaticLayout: true,
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
