import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icons';
import { ProjectCard } from './components/ProjectCard';
import { ChatMessage, ProjectTemplate, ModelType } from './types';
import { createVibeCodeSession } from './services/gemini';
import { Chat, GenerateContentResponse } from "@google/genai";

// Mock Data for Recent Chats
const RECENT_PROJECTS: ProjectTemplate[] = [
  {
    id: '1',
    title: 'AI Comparison Carousel Template',
    description: 'A dark mode carousel for comparing AI models with glassmorphism effects.',
    imageUrl: 'https://picsum.photos/400/250?random=1',
    date: 'Nov 29, 7:23 PM'
  },
  {
    id: '2',
    title: 'SaaS Dashboard Dark Mode',
    description: 'Analytics dashboard with gradient charts and sidebar navigation.',
    imageUrl: 'https://picsum.photos/400/250?random=2',
    date: 'Nov 29, 6:57 PM'
  },
  {
    id: '3',
    title: 'Landing Page Vibe',
    description: 'Hero section with purple glow effects and clean typography.',
    imageUrl: 'https://picsum.photos/400/250?random=3',
    date: 'Nov 25, 11:39 PM'
  },
  {
    id: '4',
    title: 'Mobile App Navigation',
    description: 'Floating action button and bottom tab bar interactions.',
    imageUrl: 'https://picsum.photos/400/250?random=4',
    date: 'Nov 25, 10:54 AM'
  },
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isWorkspaceMode, setIsWorkspaceMode] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [currentCode, setCurrentCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Ref for the emulator iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat Session
  useEffect(() => {
    const session = createVibeCodeSession();
    if (session) {
      setChatSession(session);
    }
  }, []);

  // Theme Toggle Effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Syntax Highlighting Effect
  useEffect(() => {
    if (viewMode === 'code' && currentCode) {
      // Use setTimeout to allow the DOM to update with new code before highlighting
      setTimeout(() => {
        if ((window as any).Prism) {
          (window as any).Prism.highlightAll();
        }
      }, 10);
    }
  }, [viewMode, currentCode]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const extractHtmlFromResponse = (text: string) => {
    // Try to extract content between ```html and ```
    const match = text.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1];
    }
    // Fallback: Check for doctype if markdown blocks aren't fully formed yet
    if (text.includes("<!DOCTYPE html>")) {
        const startIndex = text.indexOf("<!DOCTYPE html>");
        // Remove trailing markdown characters if present (e.g., ``` at the end)
        let html = text.substring(startIndex);
        html = html.replace(/```$/, '');
        return html;
    }
    return "";
  };

  const updateEmulator = (fullText: string) => {
    const htmlCode = extractHtmlFromResponse(fullText);
    if (htmlCode) {
       setCurrentCode(htmlCode);
       if (iframeRef.current) {
          // Using srcdoc is smoother than document.write for streaming updates
          iframeRef.current.srcdoc = htmlCode;
       }
    }
  };

  const handleCopyCode = () => {
    if (currentCode) {
      navigator.clipboard.writeText(currentCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !chatSession) return;

    const userMessage: ChatMessage = {
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setIsWorkspaceMode(true); // Switch to workspace view

    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let fullResponseText = "";
      
      // Create a placeholder message for the model that we will update
      setMessages(prev => [
        ...prev, 
        { role: 'model', text: '', timestamp: new Date(), isStreaming: true }
      ]);

      const result = await chatSession.sendMessageStream({ message: userMessage.text });

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text;
        if (text) {
          fullResponseText += text;
          
          // Update chat UI
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'model') {
              lastMsg.text = fullResponseText;
            }
            return newMessages;
          });

          // Update Emulator Live
          updateEmulator(fullResponseText);
        }
      }

      // Finalize message state
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMsg = newMessages[newMessages.length - 1];
        lastMsg.isStreaming = false;
        return newMessages;
      });

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error generating the code. Please try again.", timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-200 font-sans selection:bg-purple-500/30 selection:text-purple-900 dark:selection:text-purple-100 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* BACKGROUND VIBE EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
         {/* Purple Wave Gradient */}
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-400/10 dark:bg-purple-900/20 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-400/10 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
         
         {/* Wave Overlay */}
         <div className="absolute inset-0 opacity-10 dark:opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
         
         {/* Grid */}
         <div 
          className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.03]" 
          style={{
            backgroundImage: theme === 'dark' 
                ? `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`
                : `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>

      {/* Navigation */}
      <header className={`relative z-50 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/5 backdrop-blur-md transition-all duration-500 ${isWorkspaceMode ? 'bg-white/80 dark:bg-[#050505]/80' : 'bg-transparent'}`}>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                <Icons.Sparkles size={16} className="text-white" />
            </div>
            <span className="font-semibold tracking-tight text-gray-900 dark:text-white">VibeCode</span>
          </div>
          {!isWorkspaceMode && (
            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-gray-500 dark:text-gray-500">
                <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Create</a>
                <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Discover</a>
                <a href="#" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Pricing</a>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 dark:bg-[#0F0F0F] rounded-full p-1 border border-gray-200 dark:border-white/5">
                <button 
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white text-yellow-500 shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Icons.Sun size={14} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Icons.Moon size={14} />
                </button>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-violet-500 border border-white/10 ring-2 ring-white dark:ring-black"></div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className={`relative z-10 flex-grow flex flex-col w-full transition-all duration-700 ${isWorkspaceMode ? 'h-[calc(100vh-65px)]' : 'items-center max-w-[1600px] mx-auto px-4 pt-20'}`}>
        
        {/* LANDING MODE */}
        {!isWorkspaceMode && (
           <div className="flex flex-col items-center justify-center text-center w-full max-w-4xl animate-fade-in">
             <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-900/10 border border-purple-500/20 text-[11px] font-mono text-purple-600 dark:text-purple-300 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse"></span>
              <span>Vibe Coding Engine v3.0 Active</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-medium tracking-tighter text-gray-900 dark:text-white mb-8 leading-[0.9]">
              Code with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-fuchsia-500 to-indigo-600 dark:from-purple-400 dark:via-fuchsia-300 dark:to-white">pure vibes.</span>
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light mb-12 max-w-2xl leading-relaxed">
              Describe your dream interface. We'll generate the <span className="text-purple-600 dark:text-purple-300">HTML</span>, <span className="text-purple-600 dark:text-purple-300">Tailwind</span>, and <span className="text-purple-600 dark:text-purple-300">Logic</span> instantly.
            </p>

            {/* Input Component (Landing) */}
            <div className="w-full max-w-2xl relative group z-20">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-xl p-2 shadow-xl dark:shadow-2xl">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Build a spotify-style music player with glassmorphism..."
                        className="w-full bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 px-4 py-3 min-h-[60px] resize-none focus:outline-none text-base font-light"
                        rows={1}
                    />
                     <div className="flex items-center justify-between px-2 pb-1 pt-2">
                        <div className="flex gap-2">
                            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"><Icons.Paperclip size={18} /></button>
                            <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"><Icons.Sparkles size={18} /></button>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            className="bg-gray-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            Generate <Icons.ArrowUp size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Templates */}
            <div className="mt-24 w-full text-left">
                <h3 className="text-sm font-mono text-gray-400 dark:text-gray-500 mb-6 pl-1">START FROM A TEMPLATE</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     {RECENT_PROJECTS.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            </div>
           </div>
        )}

        {/* WORKSPACE MODE (Split Screen) */}
        {isWorkspaceMode && (
          <div className="flex w-full h-full overflow-hidden">
            
            {/* Left Panel: Chat & Code */}
            <div className={`${isFullscreen ? 'hidden' : 'w-1/3 min-w-[400px]'} border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505] flex flex-col h-full relative z-20 shadow-2xl transition-all duration-300`}>
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`animate-fade-in ${msg.role === 'model' ? '' : 'flex justify-end'}`}>
                            {msg.role === 'user' ? (
                                <div className="bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tr-sm max-w-[90%] text-sm shadow-sm">
                                    {msg.text}
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icons.Sparkles size={12} className="text-purple-600 dark:text-purple-500" />
                                        <span className="text-xs font-mono text-purple-600 dark:text-purple-400">VibeCode Engine</span>
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed font-mono bg-gray-50 dark:bg-[#0A0A0A] p-4 rounded-xl border border-gray-200 dark:border-white/5 overflow-x-auto relative group">
                                        <pre className="whitespace-pre-wrap break-words text-xs">
                                            {/* We only show a preview of the code or the text response */}
                                            {msg.text.substring(0, 300)}...
                                            {msg.isStreaming && <span className="inline-block w-2 h-4 bg-purple-500 ml-1 animate-pulse align-middle"></span>}
                                        </pre>
                                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                                             <span className="text-[10px] text-gray-500 dark:text-gray-600">Generated Code</span>
                                             <button 
                                                onClick={() => setViewMode('preview')}
                                                className="text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
                                             >
                                                <Icons.Zap size={10} /> Live Preview
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area (Workspace) */}
                <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505]">
                    <div className="relative bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-xl p-2 focus-within:border-purple-500/50 transition-colors">
                        <textarea
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Refine the design..."
                            className="w-full bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-600 px-3 py-2 min-h-[44px] max-h-[120px] resize-none focus:outline-none text-sm font-light"
                            rows={1}
                        />
                         <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() || isTyping}
                            className="absolute bottom-2 right-2 p-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg disabled:opacity-50 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                        >
                            <Icons.ArrowUp size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Panel: Emulator/Preview */}
            <div className="flex-1 bg-gray-100 dark:bg-[#0A0A0A] h-full flex flex-col relative overflow-hidden transition-all duration-300">
                {/* Emulator Header */}
                <div className="h-12 bg-white dark:bg-[#0F0F0F] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-100 dark:bg-[#050505] rounded-lg p-0.5 border border-gray-200 dark:border-white/5">
                            <button 
                                onClick={() => setViewMode('preview')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <Icons.Eye size={12} />
                                Preview
                            </button>
                            <button 
                                onClick={() => setViewMode('code')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === 'code' ? 'bg-white dark:bg-white/10 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            >
                                <Icons.Code size={12} />
                                Code
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-gray-50 dark:bg-[#050505] rounded-md border border-gray-200 dark:border-white/5 text-[10px] text-gray-500 font-mono flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                             localhost:3000
                        </div>
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <Icons.Minimize size={14} /> : <Icons.Maximize size={14} />}
                        </button>
                    </div>
                </div>

                {/* Content Area (Stack) */}
                <div className="flex-1 w-full h-full relative bg-gray-200 dark:bg-[#000] overflow-hidden">
                    
                    {/* PREVIEW MODE */}
                    <div className={`absolute inset-0 w-full h-full p-8 flex items-center justify-center transition-all duration-500 ${viewMode === 'preview' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
                        <div className="w-full h-full bg-white dark:bg-[#050505] rounded-lg overflow-hidden shadow-2xl relative ring-1 ring-black/5 dark:ring-white/10">
                            {messages.length > 0 && messages[messages.length-1].text === '' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#050505] z-10">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-600 dark:border-t-purple-500 rounded-full animate-spin"></div>
                                        <p className="text-gray-500 font-mono text-xs animate-pulse">Initializing Vibe Engine...</p>
                                    </div>
                                </div>
                            )}
                            <iframe 
                                ref={iframeRef}
                                title="Live Preview"
                                className="w-full h-full bg-white dark:bg-[#050505]"
                                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation"
                            />
                        </div>
                    </div>

                    {/* CODE MODE */}
                    {/* We force a dark background here for IDE feel using bg-[#1e1e1e] and ensure transparency for Prism */}
                    <div className={`absolute inset-0 w-full h-full bg-[#1e1e1e] overflow-hidden flex flex-col transition-all duration-500 ${viewMode === 'code' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 z-0 pointer-events-none'}`}>
                        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                            <span className="text-xs text-gray-400 font-mono">index.html</span>
                            <button 
                                onClick={handleCopyCode}
                                className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-white transition-colors bg-white/5 px-2 py-1 rounded border border-white/5 hover:bg-white/10"
                            >
                                {isCopied ? <Icons.Check size={12} className="text-green-400" /> : <Icons.Copy size={12} />}
                                {isCopied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
                            {currentCode ? (
                                <pre className="!bg-transparent !m-0 !p-0">
                                    <code className="language-html">
                                        {currentCode}
                                    </code>
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
                                    <Icons.Code size={24} className="opacity-20" />
                                    <span className="text-sm">No code generated yet.</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default App;