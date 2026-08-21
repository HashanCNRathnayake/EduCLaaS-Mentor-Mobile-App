export type QuickReply = {
  label: string;
  value: string;
  type?: string;
};

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  format?: 'text' | 'html';
  quickReplies?: QuickReply[];
  isSaved?: boolean;
};

export interface ChatRequest {
  message: string;
}

export interface PhpBotMessage {
  type?: string;
  content?: string;
}

export interface PhpChatResponse {
  conversationId?: string;
  watermark?: string;
  messages?: PhpBotMessage[];
  actions?: unknown[];
}
