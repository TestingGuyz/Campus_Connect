'use client';

import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, TerminalSquare, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface Log {
  type: 'log' | 'error' | 'warn';
  message: any[];
  timestamp: string;
}

export function AuthStatusMonitor() {
  const { user, isAuthLoading, claims } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [isAuthVisible, setIsAuthVisible] = useState(true);
  const [isConsoleVisible, setIsConsoleVisible] = useState(true);

  const status = {
    isAuthLoading,
    isAuthenticated: !!user,
    userId: user?.id || null,
    role: claims?.role || 'No role claim',
    email: user?.email || null,
  };

  const statusColor = isAuthLoading
    ? 'bg-yellow-600 border-yellow-700'
    : user
    ? 'bg-green-600 border-green-700'
    : 'bg-red-600 border-red-700';

  const captureConsole = useCallback((type: 'log' | 'error' | 'warn') => {
    const original = console[type];
    return (...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs(prevLogs => [{ type, message: args, timestamp }, ...prevLogs]);
      original.apply(console, args);
    };
  }, []);

  useEffect(() => {
    console.log = captureConsole('log');
    console.error = captureConsole('error');
    console.warn = captureConsole('warn');

    return () => {
      // If needed, restore original console methods on cleanup
    };
  }, [captureConsole]);
  
  const getLogColor = (type: Log['type']) => {
      switch(type) {
          case 'error': return 'text-red-400';
          case 'warn': return 'text-yellow-400';
          default: return 'text-gray-300';
      }
  }

  return (
    <div
      className="fixed bottom-4 left-4 z-[9999] w-[calc(100vw-32px)] max-w-lg rounded-lg border bg-neutral-900/90 text-white shadow-2xl backdrop-blur-sm"
    >
      {/* Auth Status Section */}
      <div className={cn("p-3 rounded-t-lg transition-colors", statusColor)}>
        <button 
          onClick={() => setIsAuthVisible(!isAuthVisible)} 
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="font-bold">Auth Status</span>
          </div>
          {isAuthVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      {isAuthVisible && (
        <pre className="whitespace-pre-wrap break-all bg-black/20 p-3 text-xs">
            {JSON.stringify(status, null, 2)}
        </pre>
      )}

      {/* Console Section */}
      <div className="flex w-full items-center justify-between text-left border-t border-neutral-700 p-3">
        <button 
          onClick={() => setIsConsoleVisible(!isConsoleVisible)} 
          className="flex flex-1 items-center gap-2"
        >
          <TerminalSquare className="h-4 w-4" />
          <span className="font-bold">Live Console</span>
        </button>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-6 w-6 text-white" onClick={(e) => {e.stopPropagation(); setLogs([])}}>
              <X className="h-4 w-4" />
          </Button>
          <button onClick={() => setIsConsoleVisible(!isConsoleVisible)}>
            {isConsoleVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {isConsoleVisible && (
        <ScrollArea className="h-[200px] bg-black/20 p-3 font-mono text-xs">
          {logs.length === 0 ? <span className="text-neutral-500">No console messages yet...</span> : (
            logs.map((log, index) => (
              <div key={index} className={cn("flex items-start gap-2 border-b border-neutral-800 py-1.5", getLogColor(log.type))}>
                <span className="shrink-0 text-neutral-600">{log.timestamp}</span>
                <div className="whitespace-pre-wrap break-all">
                  {log.message.map((msg, i) => {
                    try {
                        if (typeof msg === 'object') return <span key={i}>{JSON.stringify(msg, null, 2)} </span>;
                        return <span key={i}>{String(msg)} </span>;
                    } catch {
                        return <span key={i}>[unserializable] </span>
                    }
                  })}
                </div>
              </div>
            ))
          )}
        </ScrollArea>
      )}
    </div>
  );
}
