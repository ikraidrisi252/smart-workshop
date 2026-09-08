const fs = require('fs');
const path = require('path');

const baseDir = path.join(process.cwd(), 'smart-workshop');

const files = {
  // SPLASH SCREEN
  'src/components/ui/SplashScreen.jsx': `import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-olive rounded-2xl flex items-center justify-center shadow-lg mb-6 relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-khaki opacity-20"
            animate={{ y: ["100%", "-100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
          <span className="text-white font-bold text-3xl z-10">SW</span>
        </div>
        
        <motion.h1 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-olive mb-2"
        >
          Smart Workshop
        </motion.h1>
        
        <motion.p 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-bold text-khaki uppercase tracking-widest mb-8"
        >
          510 Army Base Workshop
        </motion.p>

        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-olive"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </div>
  );
}
`,
  // SKELETON
  'src/components/ui/Skeleton.jsx': `import { cn } from '../../utils/cn';

export default function Skeleton({ className, variant = 'rectangular' }) {
  const baseClasses = "animate-pulse bg-gray-200";
  const variants = {
    rectangular: "rounded-md",
    circular: "rounded-full",
    text: "rounded h-4 w-3/4"
  };

  return <div className={cn(baseClasses, variants[variant], className)} />;
}
`,
  // EMPTY STATE
  'src/components/ui/EmptyState.jsx': `import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = PackageOpen, 
  title = 'No Data Found', 
  description = 'There are currently no records to display here.',
  actionLabel,
  onAction
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-gray-300 text-center"
    >
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="px-6 py-2.5 bg-olive text-white rounded-lg text-sm font-bold shadow-sm hover:bg-opacity-90 hover:shadow transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
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
console.log('UI/UX Polish components generated.');
