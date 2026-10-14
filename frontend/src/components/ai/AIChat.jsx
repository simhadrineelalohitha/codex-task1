import React, { useState, useRef, useEffect } from 'react';
import { X, Bot, Send, Mic, MicOff, ImagePlus, Loader2, ShoppingBag, RefreshCw, Languages } from 'lucide-react';
import { useUIStore, useAuthStore } from '../../store';
import { aiAPI } from '../../api';
import { Link } from 'react-router-dom';
import { formatPrice } from '../product/ProductCard';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
];

const QUICK_PROMPTS = [
  '🔍 Find products under ₹500',
  '⭐ Show highest rated electronics',
  '💡 Suggest gifts under ₹2000',
  '📱 Compare latest smartphones',
  '🛒 What\'s trending now?',
];

const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3 bg-gray-100 rounded-2xl w-fit">
    {[0, 1, 2].map((i) => (
      <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
    ))}
  </div>
);

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isUser && (
        <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'
        }`}>
          {msg.content}
        </div>
        {msg.products && msg.products.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.products.map((p) => (
              <Link key={p.slug} to={`/products/${p.slug}`}
                className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs hover:border-indigo-300 hover:bg-indigo-50 transition-colors">
                <ShoppingBag size={12} className="text-indigo-600" />
                <span className="font-medium text-gray-700">{p.name}</span>
                {p.price && <span className="text-indigo-600">{formatPrice(p.price)}</span>}
              </Link>
            ))}
          </div>
        )}
        <span className="text-xs text-gray-400">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const AIChat = () => {
  const { aiChatOpen, closeAIChat } = useUIStore();
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hi${isAuthenticated && user ? `, ${user.first_name}` : ''}! I'm your SmartCart AI Shopping Assistant. I can help you:\n\n• Find products within your budget\n• Compare products and get honest reviews\n• Get personalized recommendations\n• Analyze product photos\n\nWhat can I help you shop for today?`,
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en');
  const [sessionId] = useState(`session-${Date.now()}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (aiChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aiChatOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { role: 'user', content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await aiAPI.chat({ message: text, history, language, session_id: sessionId });
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.response || data.message || 'I received your message.',
        products: data.suggested_products || [],
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: err.message?.includes('not configured')
          ? '⚠️ AI features require a Gemini API key. Please configure GEMINI_API_KEY in the backend.'
          : `Sorry, I encountered an error: ${err.message}. Please try again.`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Try Chrome.');
      return;
    }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognitionRef.current.onerror = () => setIsListening(false);
    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const userMsg = { role: 'user', content: `📸 Analyzing image: ${file.name}`, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const data = await aiAPI.analyzeImage(formData);
      const analysis = data.analysis;
      let responseText = `🔍 **Image Analysis Results:**\n\n`;
      responseText += `**Identified:** ${analysis.identified_item}\n`;
      responseText += `**Confidence:** ${analysis.confidence}\n`;
      if (analysis.quality_assessment) responseText += `\n**Quality:** ${analysis.quality_assessment}\n`;
      if (analysis.uncertainty_warnings) responseText += `\n⚠️ **Note:** ${analysis.uncertainty_warnings}\n`;
      if (data.matched_products?.length > 0) responseText += `\nHere are similar products from our catalog:`;
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: responseText,
        products: data.matched_products || [],
        timestamp: Date.now(),
      }]);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Failed to analyze image: ${err.message}`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsLoading(false);
      e.target.value = '';
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Chat cleared! How can I help you today?",
      timestamp: Date.now(),
    }]);
  };

  if (!aiChatOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden" style={{ height: '85vh', maxHeight: 600 }}>
      {/* Header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">SmartCart AI</h3>
            <p className="text-xs text-indigo-200">Shopping Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Language selector */}
          <select value={language} onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border-none outline-none cursor-pointer">
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="text-gray-900">{l.label}</option>
            ))}
          </select>
          <button onClick={clearChat} className="p-1.5 hover:bg-white/10 rounded-lg" title="Clear chat">
            <RefreshCw size={14} className="text-white" />
          </button>
          <button onClick={closeAIChat} className="p-1.5 hover:bg-white/10 rounded-lg">
            <X size={16} className="text-white" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && !isLoading && (
        <div className="px-3 py-2 border-t border-gray-100 flex gap-1.5 overflow-x-auto">
          {QUICK_PROMPTS.map((prompt) => (
            <button key={prompt} onClick={() => sendMessage(prompt)}
              className="flex-shrink-0 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-full border border-indigo-200 transition-colors whitespace-nowrap">
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
          />
          {/* Image upload */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors" title="Upload image">
            <ImagePlus size={18} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          {/* Voice input */}
          <button type="button" onClick={isListening ? stopListening : startListening}
            className={`p-2 rounded-xl transition-colors ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
            title={isListening ? 'Stop listening' : 'Voice input'}>
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          {/* Send */}
          <button type="submit" disabled={!input.trim() || isLoading}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl transition-colors">
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
