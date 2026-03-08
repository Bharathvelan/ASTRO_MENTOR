/**
 * TimeTracking Component
 * 
 * Displays time spent per concept with breakdown by language/topic.
 * Includes filtering, sorting, and chart visualization.
 * 
 * Requirements: 1.4
 */

'use client';

import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimeEntry } from '@/types/enhanced-features';
import { Clock, TrendingUp, Filter } from 'lucide-react';

interface TimeTrackingProps {
  timeEntries: TimeEntry[];
  className?: string;
}

type SortBy = 'time' | 'concept' | 'recent';
type FilterBy = 'all' | 'javascript' | 'typescript' | 'python';

interface ConceptTime {
  concept: string;
  totalTime: number;
  entries: TimeEntry[];
  language?: string;
}

export const TimeTracking: React.FC<TimeTrackingProps> = ({ timeEntries, className }) => {
  const [sortBy, setSortBy] = useState<SortBy>('time');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');

  // Aggregate time by concept
  const conceptTimes = useMemo(() => {
    const conceptMap = new Map<string, ConceptTime>();

    timeEntries.forEach((entry) => {
      const existing = conceptMap.get(entry.concept);
      
      // Extract language from concept ID (format: language-topic-id)
      const language = entry.concept.split('-')[0]?.toLowerCase();

      if (existing) {
        existing.totalTime += entry.duration;
        existing.entries.push(entry);
      } else {
        conceptMap.set(entry.concept, {
          concept: entry.concept,
          totalTime: entry.duration,
          entries: [entry],
          language: ['javascript', 'typescript', 'python'].includes(language) ? language : undefined,
        });
      }
    });

    return Array.from(conceptMap.values());
  }, [timeEntries]);

  // Filter by language
  const filteredConcepts = useMemo(() => {
    if (filterBy === 'all') return conceptTimes;
    return conceptTimes.filter((ct) => ct.language === filterBy);
  }, [conceptTimes, filterBy]);

  // Sort concepts
  const sortedConcepts = useMemo(() => {
    const sorted = [...filteredConcepts];

    switch (sortBy) {
      case 'time':
        sorted.sort((a, b) => b.totalTime - a.totalTime);
        break;
      case 'concept':
        sorted.sort((a, b) => a.concept.localeCompare(b.concept));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          const aLatest = Math.max(...a.entries.map((e) => e.timestamp.getTime()));
          const bLatest = Math.max(...b.entries.map((e) => e.timestamp.getTime()));
          return bLatest - aLatest;
        });
        break;
    }

    return sorted;
  }, [filteredConcepts, sortBy]);

  // Calculate total time
  const totalTime = useMemo(() => {
    return filteredConcepts.reduce((sum, ct) => sum + ct.totalTime, 0);
  }, [filteredConcepts]);

  // Calculate max time for bar chart scaling
  const maxTime = useMemo(() => {
    return Math.max(...sortedConcepts.map((ct) => ct.totalTime), 1);
  }, [sortedConcepts]);

  // Format time duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format concept name for display
  const formatConceptName = (concept: string): string => {
    return concept
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (timeEntries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Time Tracked Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          Start learning activities to track your time spent on different concepts.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Time Tracking
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Total time: {formatDuration(totalTime)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-500" />
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter by Language */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Filter by language"
          >
            <option value="all">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Sort by"
          >
            <option value="time">Time Spent</option>
            <option value="concept">Concept Name</option>
            <option value="recent">Most Recent</option>
          </select>
        </div>
      </div>

      {/* Time Breakdown */}
      <div className="space-y-3">
        {sortedConcepts.map((conceptTime) => {
          const percentage = (conceptTime.totalTime / maxTime) * 100;

          return (
            <div
              key={conceptTime.concept}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {formatConceptName(conceptTime.concept)}
                  </h3>
                  {conceptTime.language && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {conceptTime.language.charAt(0).toUpperCase() + conceptTime.language.slice(1)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDuration(conceptTime.totalTime)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {conceptTime.entries.length} session{conceptTime.entries.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={conceptTime.totalTime}
                  aria-valuemin={0}
                  aria-valuemax={maxTime}
                  aria-label={`${formatDuration(conceptTime.totalTime)} spent on ${formatConceptName(conceptTime.concept)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sortedConcepts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No time entries match the selected filter.
          </p>
        </div>
      )}
    </div>
  );
};
