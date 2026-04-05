'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-lg max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...props }) => (
            <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />
          ),
          h2: ({ ...props }) => (
            <h2 className="text-2xl font-semibold mt-6 mb-3" {...props} />
          ),
          h3: ({ ...props }) => (
            <h3 className="text-xl font-medium mt-5 mb-2" {...props} />
          ),
          p: ({ ...props }) => (
            <p className="my-4 leading-relaxed" {...props} />
          ),
          ul: ({ ...props }) => (
            <ul className="list-disc list-inside my-4" {...props} />
          ),
          ol: ({ ...props }) => (
            <ol className="list-decimal list-inside my-4" {...props} />
          ),
          li: ({ ...props }) => <li className="my-1" {...props} />,
          blockquote: ({ ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 py-1 my-4 bg-gray-50 italic"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <pre className="p-4 my-4 bg-gray-100 rounded-lg overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code
                className="bg-gray-100 px-1.5 py-0.5 rounded text-sm"
                {...props}
              >
                {children}
              </code>
            );
          },
          a: ({ ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full border" {...props} />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead className="bg-gray-50" {...props} />
          ),
          th: ({ ...props }) => (
            <th className="border px-4 py-2 text-left font-medium" {...props} />
          ),
          td: ({ ...props }) => (
            <td className="border px-4 py-2" {...props} />
          ),
          img: ({ ...props }) => (
            <img
              className="max-w-full h-auto rounded-lg my-4"
              loading="lazy"
              {...props}
            />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
