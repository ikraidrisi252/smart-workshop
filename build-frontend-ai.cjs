const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'smart-workshop');

const files = {
  // FLOATING AI ASSISTANT
  'src/features/ai/components/FloatingAIAssistant.jsx': `import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, Sparkles } from 'lucide-react';
import api from '../../../utils/api';

export default function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI Workshop Assistant. How can I help you today?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleSend = async () => {
    if (!query.trim()) return;
    const userMsg = query;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setQuery('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', { query: userMsg });
      setMessages(prev => [...prev, { sender: 'ai', text: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Error connecting to Gemini. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="absolute bottom-16 right-0 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden h-[500px]"
          >
            {/* Header */}
            <div className="bg-olive p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-full"><Bot size={20} /></div>
                <div>
                  <h3 className="font-bold text-sm">Workshop AI</h3>
                  <p className="text-[10px] text-gray-300">Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition"><X size={20}/></button>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.map((msg, idx) => (
                <div key={idx} className={\`flex gap-2 max-w-[85%] \${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}\`}>
                  {msg.sender === 'ai' && <div className="w-6 h-6 rounded-full bg-khaki flex items-center justify-center shrink-0 mt-1"><Sparkles size={12} className="text-olive" /></div>}
                  <div className={\`p-3 rounded-lg text-sm shadow-sm \${msg.sender === 'user' ? 'bg-olive text-white rounded-br-none' : 'bg-white border border-border text-gray-700 rounded-bl-none'}\`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-2 self-start max-w-[85%]">
                  <div className="w-6 h-6 rounded-full bg-khaki flex items-center justify-center shrink-0 mt-1"><Sparkles size={12} className="text-olive" /></div>
                  <div className="p-3 bg-white border border-border rounded-lg rounded-bl-none flex items-center gap-1 shadow-sm">
                    <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity, duration:0.6, delay:0}} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity, duration:0.6, delay:0.2}} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                    <motion.div animate={{y:[0,-5,0]}} transition={{repeat:Infinity, duration:0.6, delay:0.4}} className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-border flex items-center gap-2">
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about assets, parts, or jobs..." 
                className="flex-1 bg-gray-100 border-none focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-sm"
              />
              <button 
                onClick={handleSend}
                disabled={!query.trim() || isTyping}
                className="w-9 h-9 rounded-full bg-olive text-white flex items-center justify-center disabled:opacity-50 hover:bg-opacity-90 transition"
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-olive text-white rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition relative"
      >
        <AnimatePresence mode="wait">
          {isOpen ? <motion.div key="close" initial={{rotate:-90}} animate={{rotate:0}}><X size={24} /></motion.div> : <motion.div key="chat" initial={{rotate:90}} animate={{rotate:0}}><MessageSquare size={24} /></motion.div>}
        </AnimatePresence>
        {!isOpen && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
      </motion.button>
    </div>
  );
}`,
  // PREDICTIVE MAINTENANCE CARD
  'src/features/ai/components/PredictiveMaintenanceCard.jsx': `import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle, Calendar, Activity } from 'lucide-react';
import api from '../../../utils/api';

export default function PredictiveMaintenanceCard({ assetId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post('/ai/predict', { assetData: { assetId } })
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) return <div className="h-32 bg-gray-100 animate-pulse rounded-lg border border-border"></div>;
  if (!data) return null;

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-khaki-light to-white p-3 border-b border-border flex items-center gap-2">
        <Sparkles size={16} className="text-olive" />
        <h3 className="font-bold text-sm text-olive">AI Predictive Analysis</h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Risk Level</p>
          <div className="font-bold text-lg text-danger">{data.riskLevel}</div>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase mb-1 flex items-center gap-1"><Activity size={12}/> AI Confidence</p>
          <div className="font-bold text-lg text-olive">{data.confidenceScore}%</div>
        </div>
        <div className="col-span-2 bg-gray-50 p-2 rounded border border-border flex items-center justify-between text-sm">
          <span className="text-gray-600 flex items-center gap-1"><Calendar size={14}/> Recommended Inspection:</span>
          <span className="font-bold text-gray-800">{new Date(data.recommendedInspectionDate).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}`,
  // AI DASHBOARD PAGE
  'src/features/ai/pages/AIDashboard.jsx': `import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, ArrowRight } from 'lucide-react';
import PageTransition from '../../../components/animations/PageTransition';
import api from '../../../utils/api';

export default function AIDashboard() {
  const [query, setQuery] = useState('');
  const [nlResult, setNlResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    setIsSearching(true);
    try {
      const res = await api.post('/ai/nl-search', { query });
      setNlResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto bg-[#F8F8F8] min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-olive text-white flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-olive">AI Insights Dashboard</h1>
            <p className="text-sm text-gray-500">Intelligent overview of workshop health and natural language search.</p>
          </div>
        </div>

        {/* Natural Language Search */}
        <div className="bg-white rounded-xl shadow-sm border border-border p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-600 uppercase mb-4">Natural Language Search</h2>
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 'Show me all delayed maintenance jobs in the Machine Shop'"
              className="w-full bg-gray-50 border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg pl-4 pr-12 py-3 text-gray-800"
            />
            <button type="submit" disabled={isSearching} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded bg-primary text-white flex items-center justify-center hover:bg-olive transition">
              {isSearching ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Search size={16} />}
            </button>
          </form>

          {nlResult && (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="mt-4 p-4 bg-khaki-light/30 border border-khaki-light rounded-lg">
              <p className="text-sm text-gray-700 font-medium mb-2 flex items-center gap-2"><Sparkles size={14} className="text-olive"/> AI Understood Intent:</p>
              <pre className="text-xs bg-white p-3 rounded border border-border overflow-x-auto text-gray-600">
                {JSON.stringify(nlResult, null, 2)}
              </pre>
              <button className="mt-3 text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                Execute Query <ArrowRight size={14} />
              </button>
            </motion.div>
          )}
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-border border-t-4 border-t-danger">
            <h3 className="font-bold text-gray-800 mb-2">High-Risk Assets</h3>
            <p className="text-sm text-gray-600 mb-4">The AI has identified 3 assets requiring immediate attention based on historical failure patterns.</p>
            <ul className="text-sm space-y-2">
              <li className="flex justify-between border-b border-border pb-1"><span>TATRA-ERG-102</span><span className="text-danger font-bold">92% Risk</span></li>
              <li className="flex justify-between border-b border-border pb-1"><span>GEN-50K-01</span><span className="text-danger font-bold">85% Risk</span></li>
              <li className="flex justify-between pb-1"><span>HYD-PRESS-A</span><span className="text-warning font-bold">78% Risk</span></li>
            </ul>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-border border-t-4 border-t-warning">
            <h3 className="font-bold text-gray-800 mb-2">Predicted Inventory Shortages</h3>
            <p className="text-sm text-gray-600 mb-4">Based on upcoming preventive maintenance schedules, these parts will fall below minimum stock.</p>
            <ul className="text-sm space-y-2">
              <li className="flex justify-between border-b border-border pb-1"><span>VG46 Hydraulic Fluid</span><span className="text-warning font-bold">-5 Ltrs</span></li>
              <li className="flex justify-between pb-1"><span>Heavy Duty Brake Pads</span><span className="text-warning font-bold">-2 Sets</span></li>
            </ul>
          </div>
          <div className="bg-white p-5 rounded-lg shadow-sm border border-border border-t-4 border-t-success">
            <h3 className="font-bold text-gray-800 mb-2">Workshop Health Score</h3>
            <div className="text-4xl font-bold text-success mb-2">88/100</div>
            <p className="text-xs text-gray-500">Up 4 points from last month. Turnaround time has improved by 12% across all departments.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Frontend AI components generated.');
