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
        <span className="inline-block px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
          {type === 'simplify' ? 'Simplified Explanation' : 'Deep Dive Analysis'}
        </span>
      </div>
      
      <article className="prose prose-lg max-w-none prose-headings:text-zinc-900 dark:prose-headings:text-white prose-p:text-zinc-700 dark:prose-p:text-zinc-300 prose-strong:text-zinc-900 dark:prose-strong:text-white prose-li:text-zinc-700 dark:prose-li:text-zinc-300">
        <div className="bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-white/5 rounded-3xl p-8 md:p-10 shadow-xl dark:shadow-2xl backdrop-blur-sm transition-colors">
          <ReactMarkdown
            components={{
              h1: ({node, ...props}) => <h1 className="text-3xl font-display font-bold text-zinc-900 dark:text-white mb-6" {...props} />,
              h2: ({node, ...props}) => <h2 className="text-2xl font-display font-semibold text-zinc-800 dark:text-zinc-100 mt-8 mb-4 pb-2 border-b border-zinc-100 dark:border-white/10" {...props} />,
              h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-violet-700 dark:text-violet-200 mt-6 mb-3" {...props} />,
              ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-2 mb-6 text-zinc-700 dark:text-zinc-300 marker:text-fuchsia-500" {...props} />,
              ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-2 mb-6 text-zinc-700 dark:text-zinc-300 marker:text-violet-500" {...props} />,
              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-violet-500 pl-4 italic text-zinc-600 dark:text-zinc-400 my-6 bg-zinc-50 dark:bg-black/20 py-2 pr-2 rounded-r-lg" {...props} />,
              code: ({node, ...props}) => <code className="bg-zinc-100 dark:bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono text-violet-600 dark:text-violet-300" {...props} />,
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