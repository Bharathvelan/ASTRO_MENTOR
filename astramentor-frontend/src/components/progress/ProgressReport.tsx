/**
 * ProgressReport Component
 * 
 * Generates and displays weekly/monthly progress reports with statistics,
 * charts, and achievements. Includes export functionality.
 * 
 * Requirements: 1.6
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ProgressReport as ProgressReportData } from '@/types/enhanced-features';
import { Download, Calendar, TrendingUp, Award, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ProgressReportProps {
  report: ProgressReportData | null;
  onExport?: (format: 'pdf' | 'image') => void;
  className?: string;
}

export const ProgressReport: React.FC<ProgressReportProps> = ({
  report,
  onExport,
  className,
}) => {
  if (!report) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        <Calendar className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          No Report Available
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm">
          Generate a progress report to see your learning statistics and achievements.
        </p>
      </div>
    );
  }

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getTimeRangeLabel = (): string => {
    switch (report.timeRange) {
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
    }
  };

  const completedActivities = report.activitiesCompleted.filter((a) => a.completed);
  const averageScore =
    completedActivities.length > 0
      ? Math.round(
          completedActivities
            .filter((a) => a.score !== undefined)
            .reduce((sum, a) => sum + (a.score || 0), 0) /
            completedActivities.filter((a) => a.score !== undefined).length
        )
      : 0;

  const masteryArray = Array.from(report.masteryLevels.entries());
  const averageMastery =
    masteryArray.length > 0
      ? Math.round(masteryArray.reduce((sum, [, level]) => sum + level, 0) / masteryArray.length)
      : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Progress Report
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {getTimeRangeLabel()} • Generated {report.generatedAt.toLocaleDateString()}
          </p>
        </div>

        {/* Export Buttons */}
        {onExport && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Export as PDF"
            >
              <Download className="h-4 w-4" />
              PDF
            </button>
            <button
              onClick={() => onExport('image')}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              aria-label="Export as Image"
            >
              <Download className="h-4 w-4" />
              Image
            </button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Time</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {formatDuration(report.totalTimeSpent)}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {completedActivities.length}
              </p>
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Score</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {averageScore > 0 ? `${averageScore}%` : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Average Mastery */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg Mastery</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {averageMastery}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Activities Breakdown
        </h3>
        <div className="space-y-3">
          {report.activitiesCompleted.length > 0 ? (
            report.activitiesCompleted.slice(0, 10).map((activity, index) => (
              <div
                key={`${activity.id}-${index}`}
                className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge variant={activity.completed ? 'default' : 'secondary'}>
                    {activity.type}
                  </Badge>
                  <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                    {activity.id}
                  </span>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  {activity.score !== undefined && (
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {activity.score}%
                    </span>
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDuration(activity.duration)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-4">
              No activities completed in this time range.
            </p>
          )}
        </div>
      </div>

      {/* Mastery Levels */}
      {masteryArray.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Mastery Levels
          </h3>
          <div className="space-y-3">
            {masteryArray.map(([language, level]) => (
              <div key={language}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {language}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {level}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${level}%` }}
                    role="progressbar"
                    aria-valuenow={level}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {report.achievements.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Achievements Earned
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {report.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <Award className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {achievement.earnedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
