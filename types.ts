export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
}

export enum ModelType {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-3-pro-preview',
}

export interface CodeBlock {
  language: string;
  code: string;
}
