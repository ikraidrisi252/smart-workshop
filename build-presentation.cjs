const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'smart-workshop');

const files = {
  // PRESENTATION LAYOUT
  'src/features/presentation/pages/PresentationEngine.jsx': `import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Play, ShieldAlert } from 'lucide-react';

import SlideWelcome from '../slides/SlideWelcome';
import SlideIntro from '../slides/SlideIntro';
import SlideWorkflow from '../slides/SlideWorkflow';
import SlideExecSummary from '../slides/SlideExecSummary';

const slides = [
  { id: 'welcome', component: SlideWelcome },
  { id: 'intro', component: SlideIntro },
  { id: 'workflow', component: SlideWorkflow },
  { id: 'summary', component: SlideExecSummary },
];

export default function PresentationEngine() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) setCurrentSlide(c => c + 1);
  };
  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide(c => c - 1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Space') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'Escape') navigate('/');
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide]);

  const CurrentComponent = slides[currentSlide].component;

  return (
    <div className="fixed inset-0 bg-white overflow-hidden text-gray-800 font-sans flex flex-col z-[200]">
      {/* Disclaimer */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">
        <ShieldAlert size={14} className="text-khaki" />
        Sample Demonstration Data
      </div>

      {/* Main Slide Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute inset-0 w-full h-full"
          >
            <CurrentComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Presentation Controls Overlay */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white shadow-2xl px-6 py-3 rounded-full border border-gray-200 z-50">
        <button onClick={handlePrev} disabled={currentSlide === 0} className="p-2 text-olive disabled:opacity-30 hover:bg-gray-100 rounded-full transition">
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-sm font-bold text-gray-500 w-24 text-center">
          Slide {currentSlide + 1} / {slides.length}
        </div>

        <button onClick={handleNext} disabled={currentSlide === slides.length - 1} className="p-2 text-olive disabled:opacity-30 hover:bg-gray-100 rounded-full transition">
          <ChevronRight size={24} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-2"></div>
        
        <button onClick={() => navigate('/')} className="text-sm font-bold text-danger hover:underline">
          Exit Tour
        </button>
      </div>
    </div>
  );
}
`,
  // SLIDE: WELCOME
  'src/features/presentation/slides/SlideWelcome.jsx': `import { motion } from 'framer-motion';

export default function SlideWelcome() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-olive-dark to-olive text-white p-12">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1 }} className="text-center">
        <div className="w-32 h-32 bg-white/10 rounded-full mx-auto mb-8 flex items-center justify-center border-4 border-khaki shadow-2xl">
          <span className="text-4xl font-black text-khaki">510</span>
        </div>
        <h1 className="text-6xl font-bold mb-4 tracking-tight">Smart Workshop</h1>
        <h2 className="text-2xl text-khaki-light mb-12 font-medium tracking-wide uppercase">Asset & Maintenance Management System</h2>
        
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 inline-block text-left">
          <p className="text-sm text-gray-300 mb-1 uppercase font-bold">Presentation Demo</p>
          <p className="text-lg font-bold text-white mb-4">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <div className="flex gap-12">
            <div>
              <p className="text-xs text-khaki uppercase tracking-wider mb-1">Location</p>
              <p className="font-bold">Meerut Base Workshop</p>
            </div>
            <div>
              <p className="text-xs text-khaki uppercase tracking-wider mb-1">Status</p>
              <p className="font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Production Ready</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
`,
  // SLIDE: INTRO
  'src/features/presentation/slides/SlideIntro.jsx': `import { motion } from 'framer-motion';
import { Target, Zap, ShieldCheck } from 'lucide-react';

export default function SlideIntro() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-12">
      <div className="max-w-5xl w-full">
        <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl font-bold text-olive mb-4 text-center">Digital Transformation</motion.h2>
        <motion.p initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="text-xl text-gray-500 mb-16 text-center max-w-3xl mx-auto">
          Replacing fragmented paper trails and manual ledgers with a centralized, AI-assisted platform.
        </motion.p>

        <div className="grid grid-cols-3 gap-8">
          {[
            { icon: Target, title: "Precision Tracking", desc: "Every asset gets a unique digital QR identity, ensuring 100% visibility of military hardware." },
            { icon: Zap, title: "Workflow Automation", desc: "Maintenance jobs move seamlessly from registration to QA with automated notifications." },
            { icon: ShieldCheck, title: "Enterprise Security", desc: "Strict Role-Based Access Control (RBAC) separates Officers, Admins, and Technicians." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 + (i * 0.2) }}
              className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-olive/10 text-olive rounded-full flex items-center justify-center mb-6">
                <item.icon size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
`,
  // SLIDE: WORKFLOW
  'src/features/presentation/slides/SlideWorkflow.jsx': `import { motion } from 'framer-motion';
import { FilePlus, Wrench, CheckCircle, SearchCode } from 'lucide-react';

export default function SlideWorkflow() {
  const steps = [
    { title: "Asset Arrival", icon: SearchCode, desc: "QR Scanned & Ticket Created" },
    { title: "Diagnosis", icon: SearchCode, desc: "AI Failure Analysis" },
    { title: "Repair", icon: Wrench, desc: "Parts Issued & Fixed" },
    { title: "QA Passed", icon: CheckCircle, desc: "Vehicle Ready for Duty" },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-white p-12">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-4xl font-bold text-olive mb-16">Standardized Maintenance Workflow</motion.h2>
      
      <div className="flex items-center justify-center gap-4 w-full max-w-6xl">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center">
            <motion.div 
              initial={{ scale: 0, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              transition={{ delay: i * 0.4, type: 'spring' }}
              className="w-48 h-48 bg-gray-50 border-2 border-olive rounded-full flex flex-col items-center justify-center shadow-lg relative z-10"
            >
              <step.icon size={40} className="text-khaki mb-4" />
              <h3 className="font-bold text-olive text-lg">{step.title}</h3>
              <p className="text-xs text-gray-500 mt-2 text-center px-4">{step.desc}</p>
            </motion.div>

            {i < steps.length - 1 && (
              <motion.div 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 100, opacity: 1 }}
                transition={{ delay: (i * 0.4) + 0.2, duration: 0.4 }}
                className="h-2 bg-olive w-24 -mx-2 z-0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
`,
  // SLIDE: EXEC SUMMARY
  'src/features/presentation/slides/SlideExecSummary.jsx': `import { motion } from 'framer-motion';

export default function SlideExecSummary() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-12">
      <div className="w-full max-w-5xl bg-white shadow-2xl p-16 rounded-xl border border-gray-200">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b-4 border-olive pb-6 mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-olive uppercase tracking-tight">Executive Summary</h1>
            <p className="text-gray-500 font-bold mt-2">Project Completion Report • 510 Army Base Workshop</p>
          </div>
          <img src="/placeholder-logo.png" alt="" className="w-16 h-16 bg-gray-200 rounded" />
        </motion.div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Modules Delivered</h3>
            <ul className="space-y-3 font-medium text-gray-600 list-disc pl-5">
              <li>Role-Based UI (Admin, Tech, Executive)</li>
              <li>QR Code Asset Management</li>
              <li>Live Maintenance Tracking</li>
              <li>Inventory & Procurement Lifecycles</li>
              <li>Gemini AI Insights & Predictors</li>
            </ul>
          </motion.div>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Technical Infrastructure</h3>
            <ul className="space-y-3 font-medium text-gray-600 list-disc pl-5">
              <li>React 19 / Vite / Tailwind UI</li>
              <li>Node.js / Express Enterprise Backend</li>
              <li>PostgreSQL / Drizzle ORM</li>
              <li>Strict Zod Validation Pipelines</li>
              <li>Docker & CI/CD Pipeline Ready</li>
            </ul>
          </motion.div>
        </div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="flex justify-between items-end pt-12 border-t border-gray-200 mt-auto">
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-12"></div>
            <p className="text-xs uppercase font-bold text-gray-500">Prepared By</p>
          </div>
          <div className="text-center w-64">
            <div className="border-b border-gray-400 mb-2 h-12"></div>
            <p className="text-xs uppercase font-bold text-gray-500">Reviewed By (Project Guide)</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content);
}
console.log('Presentation components generated.');
