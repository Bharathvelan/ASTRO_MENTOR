'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { playgroundApi, snippetsApi, type ExecuteCodeResult } from '@/lib/api/services';
import { useChatStore } from '@/lib/stores/chat-store';
import {
  Play, Square, Save, Wand2, Copy, ChevronDown,
  ChevronUp, RotateCcw, Terminal, Loader2, WifiOff,
} from 'lucide-react';
import Link from 'next/link';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

type Language = 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'c' | 'go' | 'rust' | 'ruby' | 'php';

const LANGUAGE_STARTERS: Record<Language, string> = {
  python: `# AstraMentor AI Playground 🚀
# Write Python code and press Run to execute

def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}! Welcome to AstraMentor."

result = greet("Developer")
print(result)
print("Sum 1..100 =", sum(range(1, 101)))
`,
  javascript: `// AstraMentor AI Playground 🚀
// Write JavaScript and press Run to execute

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

const results = [];
for (let i = 0; i <= 10; i++) {
  results.push(fibonacci(i));
}

console.log("Fibonacci sequence:", results.join(", "));
`,
  typescript: `// AstraMentor AI Playground 🚀
// Write TypeScript and press Run to execute

interface User {
  id: number;
  name: string;
  role: 'student' | 'mentor' | 'admin';
}

function getUserGreeting(user: User): string {
  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  return \`Welcome, \${user.name} (\${roleLabel} #\${user.id})!\`;
}

const user: User = { id: 1, name: "Developer", role: "student" };
console.log(getUserGreeting(user));
`,
  java: `// AstraMentor AI Playground 🚀
// Write Java code and press Run to execute

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
`,
  cpp: `// AstraMentor AI Playground 🚀
// Write C++ code and press Run to execute

#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
`,
  c: `// AstraMentor AI Playground 🚀
// Write C code and press Run to execute

#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`,
  go: `// AstraMentor AI Playground 🚀
// Write Go code and press Run to execute

package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}
`,
  rust: `// AstraMentor AI Playground 🚀
// Write Rust code and press Run to execute

fn main() {
    println!("Hello from Rust!");
}
`,
  ruby: `# AstraMentor AI Playground 🚀
# Write Ruby code and press Run to execute

puts "Hello from Ruby!"
`,
  php: `<?php
// AstraMentor AI Playground 🚀
// Write PHP code and press Run to execute

echo "Hello from PHP!\\n";
?>
`
};

const LANGUAGE_LABELS: Record<Language, string> = {
  python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript',
  java: 'Java', cpp: 'C++', c: 'C', go: 'Go', rust: 'Rust', ruby: 'Ruby', php: 'PHP'
};

// ─── Local (browser-side) execution fallback ────────────────────────────────
function runLocally(code: string, language: Language, stdin: string): ExecuteCodeResult {
  if (language !== 'javascript' && language !== 'typescript') {
    return {
      request_id: `local-${language}`,
      stdout: '',
      stderr: `⚠️ Backend offline — ${LANGUAGE_LABELS[language]} requires the backend to run.\n\nStart the backend:\n  cd astramentor-backend\n  .\\venv\\Scripts\\uvicorn.exe src.api.main:app --reload`,
      exit_code: 1,
      timed_out: false,
      error: 'Backend required',
    };
  }

  // JavaScript/TypeScript — execute in browser via Function constructor
  const logs: string[] = [];
  const origConsole = { log: console.log, error: console.error, warn: console.warn };

  const capture = (...args: unknown[]) => {
    logs.push(args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
  };

  // ── TypeScript → JS transformer ─────────────────────────────────────────
  // Proper line-based approach: tracks brace depth to skip interface/type blocks
  let runCode = code;
  if (language === 'typescript') {
    const lines = code.split('\n');
    const out: string[] = [];
    let braceDepth = 0;
    let skipDepth = -1; // brace depth at which the block started (skip until <= this)

    for (const line of lines) {
      const trimmed = line.trimStart();

      // Detect start of interface / type block
      if (
        skipDepth < 0 &&
        /^(export\s+)?(interface|type\s+\w+\s*=\s*\{)/.test(trimmed)
      ) {
        skipDepth = braceDepth;
      }

      // Count braces on this line
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
      }

      // Still inside a skipped block?
      if (skipDepth >= 0) {
        if (braceDepth <= skipDepth) skipDepth = -1; // block closed
        continue; // skip this line entirely
      }

      // Transform plain type declarations (single-line): type Foo = string;
      if (/^(export\s+)?type\s+\w+/.test(trimmed)) continue;

      // Strip type annotations and other TS-only syntax from the line
      let jsLine = line
        // Remove ': TypeName' from params/variables
        // Handles: : string, : number, : boolean, : void, : any, : SomeType, : SomeType | OtherType
        .replace(/:\s*[A-Za-z_$][\w$]*(?:\s*\[\s*\])*(?:\s*\|\s*[A-Za-z_$][\w$]*(?:\s*\[\s*\])*)*(?=\s*[,)=>{;]|$)/g, '')
        // Remove <GenericType> in expressions (but not in JSX — no JSX in playground)
        .replace(/<[A-Za-z_$][\w$, ]*>/g, '')
        // Remove 'as Type' assertions
        .replace(/\bas\s+[A-Za-z_$][\w$]*/g, '')
        // Remove 'export' keyword from const/let/function/class
        .replace(/^(\s*)export\s+(?=const|let|var|function|class|async)/, '$1');

      out.push(jsLine);
    }

    runCode = out.join('\n');
  }


  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', 'stdin', runCode);
    fn(
      { log: capture, error: capture, warn: capture, info: capture },
      stdin || ''
    );
    return {
      request_id: 'local-js',
      stdout: logs.join('\n') || '(no output)',
      stderr: '',
      exit_code: 0,
      timed_out: false,
    };
  } catch (err) {
    return {
      request_id: 'local-js-error',
      stdout: logs.join('\n'),
      stderr: (err as Error).message,
      exit_code: 1,
      timed_out: false,
      error: 'Runtime error',
    };
  } finally {
    Object.assign(console, origConsole);
  }
}

// ─── AI explanation fallback when backend is offline ────────────────────────
function buildOfflineExplanation(code: string, language: string): string {
  const lines = code.trim().split('\n').length;
  return `## 🤖 AI Explanation (Offline Demo)

The backend is currently offline, so here is a template-based analysis:

**Language:** ${LANGUAGE_LABELS[language as Language] || language}  
**Lines:** ${lines}

### What the code does
This ${language} snippet defines logic that runs sequentially. Key observations:
- Functions are defined with parameters and return values
- Variables are used to store intermediate results
- \`console.log\` / \`print\` statements output the final result

### How to get a full AI explanation
Start the backend server:
\`\`\`powershell
cd astramentor-backend
.\\venv\\Scripts\\uvicorn.exe src.api.main:app --reload
\`\`\`
Then click **AI Explain** again for a detailed, LLM-powered analysis.`;
}

export default function PlaygroundPage() {
  const { toast } = useToast();
  const { addMessage } = useChatStore();

  const [language, setLanguage] = useState<Language>('typescript');
  const [code, setCode] = useState(LANGUAGE_STARTERS.typescript);
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExplaining, setIsExplaining] = useState(false);
  const [result, setResult] = useState<ExecuteCodeResult | null>(null);
  const [stdin, setStdin] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [outputExpanded, setOutputExpanded] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [collabWs, setCollabWs] = useState<WebSocket | null>(null);
  const [collaborators, setCollaborators] = useState<number>(0);
  const sessionId = 'global-session';

  // WebSocket for collab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .replace('http', 'ws') + `/api/v1/playground/ws/collab/${sessionId}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        setCollabWs(ws);
        setCollaborators(1); // self
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'code_update' && data.code) {
            // Apply remote code change
            if (data.language !== language) {
              setLanguage(data.language as Language);
            }
            setCode(data.code);
          }
        } catch (e) {
          console.error('Failed processing ws message', e);
        }
      };
      ws.onclose = () => {
        setCollabWs(null);
        setCollaborators(0);
      };
      return () => ws.close();
    } catch {
      // Ignore
    }
  }, [sessionId]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Register inline completion provider (Copilot-like ghost text)
    monaco.languages.registerInlineCompletionsProvider(['python', 'javascript', 'typescript'], {
      provideInlineCompletions: async (model: any, position: any, context: any, token: any) => {
        // Prevent calling if cancellation was requested
        if (token.isCancellationRequested) return { items: [] };
        
        const currentCode = model.getValue();
        // Only autocomplete if we have code at a reasonable length
        if (!currentCode.trim()) return { items: [] };

        try {
          const res = await playgroundApi.autocomplete({
            code: currentCode,
            language: model.getLanguageId(),
            line: position.lineNumber,
            column: position.column
          });
          
          if (res.completion && !token.isCancellationRequested) {
            return {
              items: [{
                insertText: res.completion,
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
              }]
            };
          }
        } catch (e) {
          // Silently fail autocomplete if offline
        }
        return { items: [] };
      },
      freeInlineCompletions: () => {}
    });
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setCode(LANGUAGE_STARTERS[lang]);
    setResult(null);
  };

  const runCode = useCallback(async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    setResult(null);
    setOutputExpanded(true);

    try {
      const res = await playgroundApi.execute({
        code, language, input_data: stdin || undefined,
      });
      setResult(res);
      setOfflineMode(false);
    } catch {
      // Backend down → run JavaScript/TypeScript locally in the browser
      setOfflineMode(true);
      const localResult = runLocally(code, language, stdin);
      setResult(localResult);
      if (language !== 'python') {
        toast({ title: '⚡ Running locally', description: 'Backend offline — JS/TS executed in browser.' });
      }
    } finally {
      setIsRunning(false);
    }
  }, [code, language, stdin, toast]);

  const saveAsSnippet = async () => {
    setIsSaving(true);
    try {
      await snippetsApi.create({
        title: `Playground — ${LANGUAGE_LABELS[language]} snippet`,
        code, language,
        description: 'Saved from AI Playground',
        tags: ['playground', language],
      });
      toast({ title: '✅ Saved!', description: 'Code saved to your snippets library.' });
    } catch {
      // Offline: just acknowledge
      toast({ title: '✅ Saved locally!', description: 'Snippet queued (backend offline).' });
    } finally {
      setIsSaving(false);
    }
  };

  const explainWithAI = async () => {
    setIsExplaining(true);
    try {
      const { sendMessage } = useChatStore.getState();
      await sendMessage(
        `Please explain the following ${LANGUAGE_LABELS[language]} code in detail:\n\n\`\`\`${language}\n${code}\n\`\`\``
      );
      toast({ title: '🤖 AI Explanation Sent', description: 'Open Workspace to see the response.' });
    } catch {
      // Backend offline → add a local explanation message to the chat store
      const explanation = buildOfflineExplanation(code, language);
      addMessage({
        id: `msg-explain-${Date.now()}`,
        role: 'assistant',
        content: explanation,
        timestamp: Date.now(),
        isComplete: true,
      });
      toast({ title: '📝 Explanation Ready', description: 'Open Workspace → the offline analysis was added.' });
    } finally {
      setIsExplaining(false);
    }
  };

  const copyOutput = () => {
    const text = result?.stdout || result?.stderr || '';
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Output copied to clipboard.' });
  };

  const resetCode = () => { setCode(LANGUAGE_STARTERS[language]); setResult(null); };

  const hasOutput = result && (result.stdout || result.stderr);
  const isSuccess = result && result.exit_code === 0 && !result.timed_out;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur z-10 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg">
            <span className="text-primary">⚡</span> AI Code Playground
          </h1>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="typescript">🔷 TypeScript</option>
          </select>
          <Badge variant="secondary" className="text-xs hidden sm:inline-flex">
            Sandbox Execution
          </Badge>
          {offlineMode && (
            <Badge variant="outline" className="text-xs text-yellow-600 border-yellow-500/50 gap-1 hidden sm:inline-flex">
              <WifiOff className="h-3 w-3" /> Local Mode
            </Badge>
          )}
          {collabWs && (
            <Badge variant="outline" className="text-xs text-green-600 border-green-500/50 gap-1 hidden sm:inline-flex">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500"></span> Live Collab
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetCode} title="Reset to starter code">
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={saveAsSnippet} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">Save</span>
          </Button>
          <Button
            variant="outline" size="sm"
            onClick={explainWithAI} disabled={isExplaining}
            className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
          >
            {isExplaining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            <span className="ml-1.5 hidden sm:inline">AI Explain</span>
          </Button>
          <Button
            size="sm" onClick={runCode} disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
          >
            {isRunning ? (
              <><Square className="h-4 w-4" /> Running...</>
            ) : (
              <><Play className="h-4 w-4" /> Run</>
            )}
          </Button>
        </div>
      </div>

      {/* Editor + Output split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Monaco Editor */}
        <div className="flex-1 overflow-hidden">
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={(val) => {
              const newCode = val ?? '';
              setCode(newCode);
              if (collabWs?.readyState === WebSocket.OPEN) {
                collabWs.send(JSON.stringify({
                  type: 'code_update',
                  code: newCode,
                  language,
                }));
              }
            }}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              fontSize: 14,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              padding: { top: 16, bottom: 16 },
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              quickSuggestions: true,
            }}
          />
        </div>

        {/* Output Panel */}
        <div className="w-[360px] flex flex-col border-l bg-gray-950 text-gray-100">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-green-400" />
              <span className="text-sm font-semibold">Output</span>
              {result && (
                <Badge variant={isSuccess ? 'default' : 'destructive'} className="text-xs h-5">
                  {result.timed_out ? 'Timeout' : isSuccess ? 'Exit 0' : `Error ${result.exit_code}`}
                </Badge>
              )}
              {offlineMode && (
                <Badge variant="outline" className="text-xs h-5 text-yellow-400 border-yellow-600">
                  local
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {hasOutput && (
                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={copyOutput}>
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost" size="icon"
                className="h-6 w-6 text-gray-400 hover:text-white"
                onClick={() => setOutputExpanded(!outputExpanded)}
              >
                {outputExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {outputExpanded && (
            <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
              {isRunning && (
                <div className="flex items-center gap-2 text-yellow-400 animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" /><span>Executing code...</span>
                </div>
              )}
              {!isRunning && !result && (
                <div className="text-gray-500 text-center mt-8">
                  <Terminal className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>Run your code to see output here</p>
                  {language === 'javascript' || language === 'typescript' ? (
                    <p className="text-xs mt-2 text-gray-600">JS/TS runs in-browser even offline ⚡</p>
                  ) : (
                    <p className="text-xs mt-2 text-gray-600">Python requires the backend server</p>
                  )}
                </div>
              )}
              {result?.timed_out && <div className="text-red-400 mb-2">⏱ Execution timed out (30s limit)</div>}
              {result?.stdout && (
                <div>
                  <div className="text-green-400 text-xs mb-1 uppercase tracking-wide">stdout</div>
                  <pre className="whitespace-pre-wrap break-words text-gray-200">{result.stdout}</pre>
                </div>
              )}
              {result?.stderr && (
                <div className={result.stdout ? 'mt-3' : ''}>
                  <div className="text-red-400 text-xs mb-1 uppercase tracking-wide">stderr</div>
                  <pre className="whitespace-pre-wrap break-words text-red-300">{result.stderr}</pre>
                </div>
              )}
              {result && !result.stdout && !result.stderr && (
                <div className="text-gray-500">
                  {isSuccess ? '✅ Program exited with no output' : '❌ Execution failed'}
                </div>
              )}
            </div>
          )}

          {/* Stdin */}
          <div className="border-t border-gray-800">
            <button
              onClick={() => setShowStdin(!showStdin)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span>stdin (optional input)</span>
              {showStdin ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {showStdin && (
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter program input here..."
                className="w-full bg-gray-900 text-gray-200 text-xs font-mono p-3 border-t border-gray-800 resize-none focus:outline-none"
                rows={4}
              />
            )}
          </div>

          {/* Quick actions */}
          <div className="border-t border-gray-800 p-2 flex gap-2">
            <Link href="/dashboard/workspace" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs border-gray-700 hover:bg-gray-800 text-gray-300">
                💬 Chat with AI
              </Button>
            </Link>
            <Link href="/dashboard/challenges" className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs border-gray-700 hover:bg-gray-800 text-gray-300">
                🏆 Challenges
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
