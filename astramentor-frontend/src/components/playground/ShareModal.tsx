/**
 * ShareModal Component
 * Modal for sharing code with URL generation and copy functionality
 * Requirements: 3.1, 3.6
 */

'use client';

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShareService } from '@/lib/services/share-service';
import type { ShareMetadata } from '@/types/enhanced-features';

interface ShareModalProps {
  code: string;
  language: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ code, language, onClose }) => {
  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const metadata: ShareMetadata = { title, description, isPublic };
      const link = await ShareService.createShare(code, language, metadata);
      setShareUrl(link.url);
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Share Code</h2>
        
        {!shareUrl ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <textarea
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md h-20"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span>Make public</span>
            </label>
            <div className="flex gap-2">
              <Button onClick={handleShare} disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Share Link'}
              </Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md break-all">
              {shareUrl}
            </div>
            <Button onClick={handleCopy} className="w-full gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </Button>
            <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
          </div>
        )}
      </div>
    </div>
  );
};
