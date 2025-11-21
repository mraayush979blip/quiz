import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Goal } from '../types';

interface MarkdownReaderProps {
  content: string;
  type: Goal;
}

const MarkdownReader: React.FC<MarkdownReaderProps> = ({ content, type }) => {
  return (
    <div className="max-w-3xl mx-auto animate-slide-up">
      <div className="mb-6">
        <span className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold text-violet-400 uppercase tracking-wider">
          {type === 'simplify' ? 'Simplified Explanation' : 'Deep Dive Analysis'}
        </span>
      </div>
      
      <article className="prose prose-invert prose-lg max-w-none">
        <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-sm">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-display font-bold text-white mb-6" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-display font-semibold text-zinc-100 mt-8 mb-4 pb-2 border-b border-white/10" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-violet-200 mt-6 mb-3" {...props} />,
              p: ({node, ...props}) => <p className="text-zinc-300 leading-relaxed mb-4" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-6 text-zinc-300 marker:text-fuchsia-500" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-6 text-zinc-300 marker:text-violet-500" {...props} />,
              strong: ({node, ...props}) => <strong className="text-fuchsia-200 font-semibold" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-violet-500 pl-4 italic text-zinc-400 my-6" {...props} />,
              code: ({node, ...props}) => <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-violet-300" {...props} />,
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
};

export default MarkdownReader;