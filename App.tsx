import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './components/Icons';
import { ProjectCard } from './components/ProjectCard';
import { ChatMessage, ProjectTemplate, ModelType } from './types';
import { createVibeCodeSession } from './services/gemini';
import { Chat, GenerateContentResponse } from "@google/genai";

// Mock Data for Recent Chats with Prompts
const RECENT_PROJECTS: ProjectTemplate[] = [
  {
    id: '1',
    title: 'AI Comparison Carousel Template',
    description: 'A dark mode carousel for comparing AI models with glassmorphism effects.',
    imageUrl: 'https://picsum.photos/400/250?random=1',
    date: 'Nov 29, 7:23 PM',
    prompt: 'Create a sophisticated dark mode comparison carousel for AI models. Use glassmorphism cards with distinct glowing borders for each model (Gemini, GPT-4, Claude). Include performance metrics visualized as sleek progress bars and a "Compare" interaction that expands details with a smooth transition.'
  },
  {
    id: '2',
    title: 'SaaS Dashboard Dark Mode',
    description: 'Analytics dashboard with gradient charts and sidebar navigation.',
    imageUrl: 'https://picsum.photos/400/250?random=2',
    date: 'Nov 29, 6:57 PM',
    prompt: 'Build a modern SaaS analytics dashboard in dark mode. Feature a minimalist sidebar navigation with translucent hover states, a main area with gradient line charts using CSS/SVG, and stats cards with subtle neon accents. Keep typography clean, monochromatic, and use Inter or Manrope font.'
  },
  {
    id: '3',
    title: 'Landing Page Vibe',
    description: 'Hero section with purple glow effects and clean typography.',
    imageUrl: 'https://picsum.photos/400/250?random=3',
    date: 'Nov 25, 11:39 PM',
    prompt: 'Design a high-converting landing page hero section. Center a bold typography headline with a slow text-clip gradient animation (silver to white). Add floating 3D-style abstract elements in the background with a heavy blur effect. Include a magnetic primary CTA button with a glow on hover.'
  },
  {
    id: '4',
    title: 'Mobile App Navigation',
    description: 'Floating action button and bottom tab bar interactions.',
    imageUrl: 'https://picsum.photos/400/250?random=4',
    date: 'Nov 25, 10:54 AM',
    prompt: 'Prototype a mobile app interface layout with a floating bottom navigation bar. The active tab should have a soft spotlight glow. Include a central "Create" action button that pulses gently. The main content should be a list of items with swipeable actions and smooth transition animations.'
  },
];

type FileType = 'index.html' | 'styles.css' | 'script.js';

interface ProjectFile {
    name: string;
    content: string;
    language: string;
}

interface AIModel {
    id: string;
    name: string;
    description: string;
    icon?: React.ReactNode;
}

const MODELS: AIModel[] = [
    { id: 'gemini-3-pro', name: 'Gemini 3 Pro', description: 'Most creative & capable' },
    { id: 'claude-3-5', name: 'Claude 3.5 Sonnet', description: 'Exceptional coding' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'High intelligence' },
    { id: 'grok-3', name: 'Grok 3', description: 'Maximum fun & speed' },
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isWorkspaceMode, setIsWorkspaceMode] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [activeFile, setActiveFile] = useState<FileType>('index.html');
  const [isCopied, setIsCopied] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  
  // Model Selection State
  const [selectedModel, setSelectedModel] = useState<AIModel>(MODELS[0]);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Ref for the emulator iframe
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
    if (viewMode === 'code') {
      setTimeout(() => {
        if ((window as any).Prism) {
          (window as any).Prism.highlightAll();
        }
      }, 10);
    }
  }, [viewMode, files, activeFile]);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
    }
  };

  const handleTemplateClick = (prompt?: string) => {
    if (prompt) {
      setInput(prompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
            }
        }, 0);
      }
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => {
        const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcript;
      });
      setTimeout(() => {
         if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 300)}px`;
         }
      }, 0);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const extractHtmlFromResponse = (text: string) => {
    const match = text.match(/```html([\s\S]*?)```/);
    if (match && match[1]) {
      return match[1];
    }
    if (text.includes("<!DOCTYPE html>")) {
        const startIndex = text.indexOf("<!DOCTYPE html>");
        let html = text.substring(startIndex);
        html = html.replace(/```$/, '');
        return html;
    }
    return "";
  };

  const detectFiles = (html: string) => {
    if (!html) return [];
    const detected = [
        { name: 'index.html', icon: Icons.FileCode }
    ];
    
    if (/<style[^>]*>[\s\S]*?<\/style>/i.test(html)) {
        detected.push({ name: 'styles.css', icon: Icons.FileType });
    }
    
    if (/<script(?![^>]*src=)([^>]*>)([\s\S]*?)<\/script>/gi.test(html)) {
         detected.push({ name: 'script.js', icon: Icons.FileJson });
    }
    
    return detected;
  };

  const syncAiToFiles = (html: string) => {
    const newFiles: ProjectFile[] = [];

    // 1. index.html (Cleaned)
    // We keep the scripts/styles in index.html for simplicity in this emulator logic, 
    // but in a real app we might strip them if we separate them fully.
    // For now, index.html contains everything.
    newFiles.push({
        name: 'index.html',
        content: html,
        language: 'html'
    });

    // 2. styles.css
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
        newFiles.push({
            name: 'styles.css',
            content: styleMatch[1].trim(),
            language: 'css'
        });
    }

    // 3. script.js
    const scriptMatches = [...html.matchAll(/<script(?![^>]*src=)([^>]*>)([\s\S]*?)<\/script>/gi)];
    if (scriptMatches.length > 0) {
        const jsContent = scriptMatches.map(m => m[2].trim()).join('\n\n');
        newFiles.push({
            name: 'script.js',
            content: jsContent,
            language: 'javascript'
        });
    }

    setFiles(newFiles);
    
    // Default to displaying index.html if no file selected or if current file gone
    if (!newFiles.find(f => f.name === activeFile)) {
        setActiveFile('index.html');
    }
  };

  const compileProject = () => {
    // Reconstruct the full HTML from the files array
    const indexFile = files.find(f => f.name === 'index.html');
    if (!indexFile) return '';

    let fullHtml = indexFile.content;

    // In this simple implementation, we assume index.html is the source of truth from AI.
    // If the user edits "styles.css", we would need to inject it back into index.html.
    // For now, let's just return index.html as the AI generates the "Single File" output as requested.
    // To support true separate editing, we'd need to parse/replace the <style> tag in index.html with the content of styles.css.
    
    // Attempt simple injection for live editing:
    const cssFile = files.find(f => f.name === 'styles.css');
    if (cssFile) {
        fullHtml = fullHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/i, `<style>${cssFile.content}</style>`);
    }

    const jsFile = files.find(f => f.name === 'script.js');
    if (jsFile) {
        // This is tricky with multiple scripts, but we'll replace the last inline script or append
        // For simplicity in this demo, we won't fully support bi-directional sync yet unless requested.
        // We'll trust the AI output loop.
    }

    return fullHtml;
  };

  const updateEmulator = (fullText: string) => {
    const htmlCode = extractHtmlFromResponse(fullText);
    if (htmlCode) {
       syncAiToFiles(htmlCode);
       if (iframeRef.current) {
          iframeRef.current.srcdoc = htmlCode;
       }
    }
  };

  const handleCopyCode = () => {
    const file = files.find(f => f.name === activeFile);
    if (file) {
      navigator.clipboard.writeText(file.content);
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
    setIsWorkspaceMode(true);

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      let fullResponseText = "";
      
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
          
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === 'model') {
              lastMsg.text = fullResponseText;
            }
            return newMessages;
          });

          updateEmulator(fullResponseText);
        }
      }

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

  // File Management Handlers
  const handleAddFile = () => {
    const name = prompt("Enter file name (e.g., utils.js):");
    if (name) {
        const ext = name.split('.').pop();
        let lang = 'javascript';
        if (ext === 'css') lang = 'css';
        if (ext === 'html') lang = 'html';
        if (ext === 'json') lang = 'json';
        
        const newFile: ProjectFile = { name, content: '', language: lang };
        setFiles(prev => [...prev, newFile]);
        setActiveFile(name as FileType);
    }
  };

  const handleDeleteFile = (fileName: string) => {
    if (fileName === 'index.html') {
        alert("Cannot delete index.html");
        return;
    }
    if (confirm(`Delete ${fileName}?`)) {
        setFiles(prev => prev.filter(f => f.name !== fileName));
        if (activeFile === fileName) setActiveFile('index.html');
    }
  };

  const handleRenameFile = (oldName: string) => {
      if (oldName === 'index.html') return;
      const newName = prompt("Rename file:", oldName);
      if (newName && newName !== oldName) {
          setFiles(prev => prev.map(f => f.name === oldName ? { ...f, name: newName } : f));
          if (activeFile === oldName) setActiveFile(newName as FileType);
      }
  };

  const ModelSelector = () => (
      <div className="relative">
        <button 
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-gray-300 dark:hover:border-white/10 group"
        >
            <Icons.Bot size={18} className="text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-black dark:group-hover:text-white transition-colors">
                {selectedModel.name}
            </span>
            <Icons.ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 transition-transform duration-300 ${showModelDropdown ? 'rotate-180' : ''}`} />
        </button>

          {showModelDropdown && (
              <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowModelDropdown(false)}
                  ></div>
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in origin-bottom-left">
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                            Select Model
                        </div>
                        {MODELS.map((model) => (
                            <button
                                key={model.id}
                                onClick={() => {
                                    setSelectedModel(model);
                                    setShowModelDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-start justify-between group transition-all duration-200 ${selectedModel.id === model.id ? 'bg-gray-100 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                <div>
                                    <div className={`text-sm font-medium mb-0.5 ${selectedModel.id === model.id ? 'text-black dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {model.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                        {model.description}
                                    </div>
                                </div>
                                {selectedModel.id === model.id && (
                                    <Icons.Check size={16} className="text-black dark:text-white mt-1" />
                                )}
                            </button>
                        ))}
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/5">
                            <button className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                Upgrade to VibeCode Pro
                            </button>
                        </div>
                      </div>
                  </div>
              </>
          )}
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-black dark:text-white font-sans selection:bg-gray-300/50 selection:text-black dark:selection:text-white flex flex-col relative overflow-hidden transition-colors duration-500">
      
      {/* BACKGROUND VIBE EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#050505]">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800/10 via-[#050505] to-[#050505] animate-pulse-slow"></div>
         <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>
      </div>

      {/* Navigation */}
      <header className={`relative z-50 flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-white/5 backdrop-blur-md transition-all duration-500 ${isWorkspaceMode ? 'bg-white/80 dark:bg-[#050505]/80' : 'bg-transparent'}`}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-xl shadow-black/5 dark:shadow-white/5 group-hover:scale-105 transition-transform">
                <Icons.Sparkles size={20} className="text-white dark:text-black" />
            </div>
            <span className="text-lg font-bold tracking-tight text-black dark:text-white">VibeCode</span>
          </div>
          {!isWorkspaceMode && (
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-black dark:text-white">
                <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Create</a>
                <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Discover</a>
                <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Pricing</a>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-5">
            <div className="flex items-center bg-gray-100 dark:bg-[#0F0F0F] rounded-full p-1.5 border border-gray-200 dark:border-white/5">
                <button 
                  onClick={() => setTheme('light')}
                  className={`p-2 rounded-full transition-all duration-300 ${theme === 'light' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Icons.Sun size={18} />
                </button>
                <button 
                  onClick={() => setTheme('dark')}
                  className={`p-2 rounded-full transition-all duration-300 ${theme === 'dark' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  <Icons.Moon size={18} />
                </button>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-white/10 border border-white/10 ring-2 ring-white dark:ring-black"></div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className={`relative z-10 flex-grow flex flex-col w-full transition-all duration-700 ${isWorkspaceMode ? 'h-[calc(100vh-80px)]' : 'items-center max-w-[1800px] mx-auto px-6 pt-24'}`}>
        
        {/* LANDING MODE */}
        {!isWorkspaceMode && (
           <div className="flex flex-col items-center justify-center text-center w-full max-w-6xl animate-fade-in">
             <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono text-black dark:text-white mb-10 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              <span className="w-2 h-2 rounded-full bg-black dark:bg-white animate-pulse"></span>
              <span>Vibe Coding Engine v3.0 Active</span>
            </div>
            
            <h1 className="text-7xl md:text-9xl font-medium tracking-tighter text-black dark:text-white mb-10 leading-[0.9]">
              Code with <br />
              <span className="text-gray-500 dark:text-gray-400">pure vibes.</span>
            </h1>
            
            <p className="text-black dark:text-white text-2xl font-light mb-16 max-w-3xl leading-relaxed">
              Describe your dream interface. We'll generate the <span className="font-medium hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-default">HTML</span>, <span className="font-medium hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-default">Tailwind</span>, and <span className="font-medium hover:text-gray-500 dark:hover:text-gray-400 transition-colors cursor-default">Logic</span> instantly.
            </p>

            {/* Input Component (Landing) */}
            <div className="w-full max-w-4xl relative group z-20">
                <div className="absolute -top-24 -bottom-24 -left-24 -right-24 -z-10 pointer-events-none">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000010_1px,transparent_1px),linear-gradient(to_bottom,#00000010_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_0%,transparent_100%)]" />
                </div>

                <div className="absolute -inset-1.5 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <div className="relative bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKeyDown}
                        placeholder="Build a spotify-style music player with glassmorphism..."
                        className="w-full bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 px-6 py-5 min-h-[80px] resize-none focus:outline-none text-xl font-light"
                        rows={1}
                    />
                     <div className="flex items-center justify-between px-4 pb-2 pt-3">
                        <div className="flex items-center gap-3">
                            <ModelSelector />
                            <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                            <button className="p-2.5 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/5"><Icons.Paperclip size={20} /></button>
                            <button 
                                onClick={handleVoiceInput}
                                className={`p-2.5 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Icons.Mic size={20} />
                            </button>
                        </div>
                        <button 
                            onClick={handleSendMessage}
                            className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-medium text-base hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors flex items-center gap-2.5 shadow-lg"
                        >
                            Generate <Icons.ArrowUp size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Templates */}
            <div className="mt-32 w-full text-left">
                <h3 className="text-base font-mono text-black dark:text-white mb-8 pl-1">START FROM A TEMPLATE</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     {RECENT_PROJECTS.map((project) => (
                        <ProjectCard 
                          key={project.id} 
                          project={project} 
                          onClick={() => handleTemplateClick(project.prompt)}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="w-full mt-32 mb-16 pt-10 border-t border-gray-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between text-sm text-black dark:text-white">
                <div className="flex items-center gap-2.5">
                   <div className="w-5 h-5 bg-black dark:bg-white rounded-md flex items-center justify-center">
                      <Icons.Sparkles size={10} className="text-white dark:text-black" />
                   </div>
                   <span>© 2024 VibeCode Inc.</span>
                </div>
                <div className="flex items-center gap-8 mt-6 md:mt-0">
                    <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-gray-500 dark:hover:text-gray-400 transition-colors">Twitter</a>
                </div>
            </footer>
           </div>
        )}

        {/* WORKSPACE MODE (Split Screen) */}
        {isWorkspaceMode && (
          <div className="flex w-full h-full overflow-hidden">
            
            {/* Left Panel: Chat & Code */}
            <div className={`${isFullscreen ? 'hidden' : 'w-[450px] min-w-[450px] lg:w-[480px]'} border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505] flex flex-col h-full relative z-20 shadow-2xl transition-all duration-300`}>
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {messages.map((msg, idx) => {
                        const createdFiles = msg.role === 'model' ? detectFiles(extractHtmlFromResponse(msg.text)) : [];
                        return (
                        <div key={idx} className={`animate-fade-in ${msg.role === 'model' ? '' : 'flex justify-end'}`}>
                            {msg.role === 'user' ? (
                                <div className="bg-gray-100 dark:bg-[#151515] border border-gray-200 dark:border-white/5 text-gray-900 dark:text-gray-200 px-5 py-4 rounded-3xl rounded-tr-sm max-w-[90%] text-base shadow-sm leading-relaxed">
                                    {msg.text}
                                </div>
                            ) : (
                                <div className="w-full">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <Icons.Sparkles size={14} className="text-black dark:text-white" />
                                        <span className="text-sm font-mono text-gray-500 dark:text-gray-400">VibeCode Engine</span>
                                    </div>
                                    
                                    {createdFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-3 animate-fade-in">
                                            {createdFiles.map(f => (
                                                <div key={f.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg text-xs font-mono text-gray-600 dark:text-gray-300">
                                                    <f.icon size={12} className="text-gray-500" />
                                                    <span>{f.name}</span>
                                                    <Icons.Check size={10} className="text-green-500 ml-1" />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-gray-600 dark:text-gray-400 text-base leading-relaxed font-mono bg-gray-50 dark:bg-[#0A0A0A] p-5 rounded-2xl border border-gray-200 dark:border-white/5 overflow-x-auto relative group shadow-inner">
                                        <pre className="whitespace-pre-wrap break-words text-sm">
                                            {msg.text.substring(0, 300)}...
                                            {msg.isStreaming && <span className="inline-block w-2.5 h-5 bg-black dark:bg-white ml-1.5 animate-pulse align-middle"></span>}
                                        </pre>
                                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
                                             <span className="text-xs text-gray-500 dark:text-gray-600">Generated Code</span>
                                             <button 
                                                onClick={() => setViewMode('preview')}
                                                className="text-xs text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1.5 transition-colors"
                                             >
                                                <Icons.Zap size={12} /> Live Preview
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )})}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area (Workspace) */}
                <div className="p-5 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#050505]">
                    <div className="relative bg-gray-50 dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/10 rounded-2xl p-2.5 focus-within:border-black/20 dark:focus-within:border-white/20 transition-colors shadow-sm">
                        <textarea
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder="Refine the design..."
                            className="w-full bg-transparent text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-600 px-4 py-3 min-h-[56px] max-h-[160px] resize-none focus:outline-none text-base font-light pr-24"
                            rows={1}
                        />
                         <div className="absolute bottom-3 left-3 flex items-center gap-2">
                             <ModelSelector />
                         </div>
                         <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
                             <button 
                                onClick={handleVoiceInput}
                                className={`p-2 transition-colors rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Icons.Mic size={16} />
                            </button>
                             <button 
                                  onClick={handleSendMessage}
                                  disabled={!input.trim() || isTyping}
                                  className="p-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl disabled:opacity-50 hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors shadow-sm"
                              >
                                  <Icons.ArrowUp size={16} />
                              </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel: Emulator/Preview */}
            <div className="flex-1 bg-gray-100 dark:bg-[#0A0A0A] h-full flex flex-col relative overflow-hidden transition-all duration-300">
                {/* Emulator Header */}
                <div className="h-16 bg-white dark:bg-[#0F0F0F] border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-6 shadow-sm z-30">
                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500/20 border border-red-500/50"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                            <div className="w-3.5 h-3.5 rounded-full bg-green-500/20 border border-green-500/50"></div>
                        </div>
                        
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-gray-100 dark:bg-[#050505] rounded-lg p-1 border border-gray-200 dark:border-white/5">
                            <button 
                                onClick={() => setViewMode('preview')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Icons.Eye size={14} />
                                Preview
                            </button>
                            <button 
                                onClick={() => setViewMode('code')}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}
                            >
                                <Icons.Code size={14} />
                                Code
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1.5 bg-gray-50 dark:bg-[#050505] rounded-lg border border-gray-200 dark:border-white/5 text-xs text-gray-500 font-mono flex items-center gap-2.5">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             localhost:3000
                        </div>
                        <button 
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 text-gray-500 hover:text-black dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            {isFullscreen ? <Icons.Minimize size={16} /> : <Icons.Maximize size={16} />}
                        </button>
                    </div>
                </div>

                {/* Content Area (Stack) */}
                <div className="flex-1 w-full h-full relative bg-gray-200 dark:bg-[#000] overflow-hidden">
                    
                    {/* PREVIEW MODE */}
                    <div className={`absolute inset-0 w-full h-full p-8 flex items-center justify-center transition-all duration-500 ${viewMode === 'preview' ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-95 z-0 pointer-events-none'}`}>
                        <div className="w-full h-full bg-white dark:bg-[#050505] rounded-xl overflow-hidden shadow-2xl relative ring-1 ring-black/5 dark:ring-white/10">
                            {messages.length > 0 && messages[messages.length-1].text === '' && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-[#050505] z-10">
                                    <div className="flex flex-col items-center gap-5">
                                        <div className="w-14 h-14 border-2 border-black/10 dark:border-white/10 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                                        <p className="text-gray-500 font-mono text-sm animate-pulse">Initializing Vibe Engine...</p>
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
                    {/* Left Sidebar File Explorer */}
                    <div className={`absolute inset-0 w-full h-full bg-[#1e1e1e] overflow-hidden flex transition-all duration-500 ${viewMode === 'code' ? 'opacity-100 translate-x-0 z-10' : 'opacity-0 translate-x-10 z-0 pointer-events-none'}`}>
                        
                        {/* File Explorer Sidebar */}
                        <div className="w-64 bg-[#252526] border-r border-[#333] flex flex-col">
                            <div className="p-4 text-xs font-semibold text-gray-400 tracking-wider uppercase flex items-center justify-between">
                                <span>Explorer</span>
                                <button onClick={handleAddFile} className="hover:text-white transition-colors"><Icons.File size={14} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {files.map(file => (
                                    <div 
                                        key={file.name}
                                        onClick={() => setActiveFile(file.name as FileType)}
                                        className={`group flex items-center justify-between px-4 py-2 cursor-pointer text-sm font-mono transition-colors ${activeFile === file.name ? 'bg-[#37373d] text-white' : 'text-gray-400 hover:bg-[#2a2d2e] hover:text-gray-200'}`}
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            {file.language === 'html' && <Icons.FileCode size={14} className="text-orange-400" />}
                                            {file.language === 'css' && <Icons.FileType size={14} className="text-blue-400" />}
                                            {file.language === 'javascript' && <Icons.FileJson size={14} className="text-yellow-400" />}
                                            <span className="truncate">{file.name}</span>
                                        </div>
                                        {file.name !== 'index.html' && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); handleRenameFile(file.name); }} className="p-1 hover:text-white"><Icons.Settings size={12} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }} className="p-1 hover:text-red-400"><Icons.Check size={12} className="rotate-45" /></button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 flex flex-col h-full overflow-hidden">
                             {/* Editor Header */}
                             <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
                                 <div className="text-sm text-gray-400 font-mono">{activeFile}</div>
                                 <button 
                                      onClick={handleCopyCode}
                                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors py-1.5"
                                  >
                                      {isCopied ? <Icons.Check size={14} className="text-green-400" /> : <Icons.Copy size={14} />}
                                      {isCopied ? 'Copied' : 'Copy'}
                                  </button>
                             </div>

                             {/* Code Content */}
                             <div className="flex-1 overflow-auto p-6 font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
                                {files.find(f => f.name === activeFile)?.content ? (
                                    <pre className="!bg-transparent !m-0 !p-0">
                                        <code className={`language-${files.find(f => f.name === activeFile)?.language}`}>
                                            {files.find(f => f.name === activeFile)?.content}
                                        </code>
                                    </pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                                        <Icons.Code size={32} className="opacity-20" />
                                        <span className="text-base">No code generated yet.</span>
                                    </div>
                                )}
                            </div>
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