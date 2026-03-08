/**
 * MasteryLevel Component
 * 
 * Displays mastery levels for each programming language with progress bars,
 * numeric levels, and tooltips explaining mastery calculation.
 * 
 * Requirements: 1.5
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Award, Info } from 'lucide-react';

interface MasteryLevelProps {
  masteryLevels: Map<string, number>;
  className?: string;
}

interface LanguageMastery {
  language: string;
  level: number;
  displayName: string;
  color: string;
}

const LANGUAGE_CONFIG: Record<string, { displayName: string; color: string }> = {
  javascript: { displayName: 'JavaScript', color: 'bg-yellow-500' },
  typescript: { displayName: 'TypeScript', color: 'bg-blue-500' },
  python: { displayName: 'Python', color: 'bg-green-500' },
  java: { displayName: 'Java', color: 'bg-orange-500' },
  go: { displayName: 'Go', color: 'bg-cyan-500' },
  rust: { displayName: 'Rust', color: 'bg-red-500' },
};

const getMasteryLabel = (level: number): string => {
  if (level >= 90) return 'Expert';
  if (level >= 70) return 'Advanced';
  if (level >= 50) return 'Intermediate';
  if (level >= 30) return 'Beginner';
  return 'Novice';
};

const getMasteryDescription = (level: number): string => {
  if (level >= 90) return 'You have mastered this language with exceptional proficiency';
  if (level >= 70) return 'You have advanced knowledge and can tackle complex problems';
  if (level >= 50) return 'You have solid understanding and can work independently';
  if (level >= 30) return 'You are building foundational skills in this language';
  return 'You are just starting your journey with this language';
};

export const MasteryLevel: React.FC<MasteryLevelProps> = ({ masteryLevels, className }) => {
  // Convert Map to array and sort by level
  const languageMasteries: LanguageMastery[] = Array.from(masteryLevels.entries())
    .map(([language, level]) => ({
      language,
      level,
      displayName: LANGUAGE_CONFIG[language]?.displayName || language.charAt(0).toUpperCase() + language.slice(1),
      color: LANGUAGE_CONFIG[language]?.color || 'bg-gray-500',
    }))
    .sort((a, b) => b.level - a.level);

  if (languageMasteries.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Award className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Mastery Levels Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          Complete learning activities to build mastery in different programming languages.
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
            Mastery Levels
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your proficiency across programming languages
          </p>
        </div>

        {/* Info Tooltip */}
        <div className="group relative">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Mastery calculation information"
          >
            <Info className="h-5 w-5 text-gray-500" />
          </button>
          <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
              How Mastery is Calculated
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              Mastery increases with completed activities, time spent, and high scores. 
              The calculation uses diminishing returns as you progress, making it harder 
              to reach expert level. Consistent practice and quality work are key to mastery.
            </p>
          </div>
        </div>
      </div>

      {/* Mastery Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {languageMasteries.map((mastery) => (
          <div
            key={mastery.language}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5"
          >
            {/* Language Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', mastery.color)} />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {mastery.displayName}
                </h3>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {mastery.level}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  / 100
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={cn('h-3 rounded-full transition-all', mastery.color)}
                  style={{ width: `${mastery.level}%` }}
                  role="progressbar"
                  aria-valuenow={mastery.level}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${mastery.displayName} mastery level: ${mastery.level}%`}
                />
              </div>
            </div>

            {/* Mastery Label and Description */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {getMasteryLabel(mastery.level)}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {getMasteryDescription(mastery.level)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
              Overall Progress
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Average mastery across {languageMasteries.length} language{languageMasteries.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {Math.round(
                languageMasteries.reduce((sum, m) => sum + m.level, 0) / languageMasteries.length
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Average
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
