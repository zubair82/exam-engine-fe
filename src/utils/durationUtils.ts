/**
 * Duration utility helpers for Exam Engine
 * Handles parsing duration from various database formats (seconds, minutes, formatted strings)
 * and extracting duration from exam_papers metadata.
 */

/**
 * Safely parse any duration representation into seconds.
 * Supports:
 * - Number in seconds (e.g. 1800, 3600, 7200, 10800)
 * - Number in minutes (e.g. 15, 30, 45, 60, 90, 120, 180, 200) -> converted to seconds
 * - String like "30 mins", "1 hour", "3 Hours 20 Mins", "45m", "90 minutes", "1800s", "1800"
 */
export function parseDurationToSeconds(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;

  if (typeof val === 'number') {
    if (isNaN(val) || val <= 0) return null;
    // Values <= 300 are assumed to be in minutes (up to 5 hours = 300 mins).
    // Values > 300 are assumed to be in seconds (e.g. 600s = 10 mins).
    return val <= 300 ? Math.round(val * 60) : Math.round(val);
  }

  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return null;

    // Check pure integer/float string
    const num = Number(s);
    if (!isNaN(num) && num > 0) {
      return num <= 300 ? Math.round(num * 60) : Math.round(num);
    }

    // Check composite string like "3 Hours 20 Mins", "30 mins", "1 hr", "2.5 hours"
    let totalSecs = 0;
    let matched = false;

    // Hours
    const hrMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i);
    if (hrMatch) {
      totalSecs += parseFloat(hrMatch[1]) * 3600;
      matched = true;
    }

    // Minutes
    const minMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m)\b/i);
    if (minMatch) {
      totalSecs += parseFloat(minMatch[1]) * 60;
      matched = true;
    }

    // Seconds
    const secMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:seconds?|secs?|s)\b/i);
    if (secMatch) {
      totalSecs += parseFloat(secMatch[1]);
      matched = true;
    }

    if (matched && totalSecs > 0) {
      return Math.round(totalSecs);
    }
  }

  return null;
}

/**
 * Extract exam duration in seconds from any exam paper object or database row.
 * Checks all possible database column names and nested metadata fields.
 */
export function extractExamDurationSeconds(exam: any, defaultSeconds: number = 10800): number {
  if (!exam) return defaultSeconds;

  // 1. Direct fields on the exam paper row
  const directFields = [
    exam.duration_seconds,
    exam.durationSeconds,
    exam.duration_minutes ? (typeof exam.duration_minutes === 'number' ? exam.duration_minutes * 60 : exam.duration_minutes) : null,
    exam.durationMinutes ? (typeof exam.durationMinutes === 'number' ? exam.durationMinutes * 60 : exam.durationMinutes) : null,
    exam.duration_mins ? (typeof exam.duration_mins === 'number' ? exam.duration_mins * 60 : exam.duration_mins) : null,
    exam.durationMins ? (typeof exam.durationMins === 'number' ? exam.durationMins * 60 : exam.durationMins) : null,
    exam.time_duration,
    exam.timeDuration,
    exam.time_limit,
    exam.timeLimit,
    exam.total_duration,
    exam.totalDuration,
    exam.time_seconds,
    exam.time_minutes ? (typeof exam.time_minutes === 'number' ? exam.time_minutes * 60 : exam.time_minutes) : null,
    exam.duration,
  ];

  for (const field of directFields) {
    const parsed = parseDurationToSeconds(field);
    if (parsed && parsed > 0) return parsed;
  }

  // 2. Search inside nested metadata containers (metadata, paper_metadata, exam_data, config, etc.)
  const metaContainers = [
    exam.metadata,
    exam.paper_metadata,
    exam.paperMetadata,
    exam.exam_data,
    exam.examData,
    exam.config,
    exam.session_metadata,
    exam.sessionMetadata,
  ];

  for (const container of metaContainers) {
    if (!container) continue;
    let obj: any = container;
    if (typeof container === 'string') {
      try {
        obj = JSON.parse(container);
      } catch {
        continue;
      }
    }
    if (obj && typeof obj === 'object') {
      const nestedFields = [
        obj.duration_seconds,
        obj.durationSeconds,
        obj.duration_minutes ? (typeof obj.duration_minutes === 'number' ? obj.duration_minutes * 60 : obj.duration_minutes) : null,
        obj.durationMinutes ? (typeof obj.durationMinutes === 'number' ? obj.durationMinutes * 60 : obj.durationMinutes) : null,
        obj.duration_mins ? (typeof obj.duration_mins === 'number' ? obj.duration_mins * 60 : obj.duration_mins) : null,
        obj.durationMins ? (typeof obj.durationMins === 'number' ? obj.durationMins * 60 : obj.durationMins) : null,
        obj.time_duration,
        obj.timeDuration,
        obj.time_limit,
        obj.timeLimit,
        obj.total_duration,
        obj.totalDuration,
        obj.time_seconds,
        obj.time_minutes ? (typeof obj.time_minutes === 'number' ? obj.time_minutes * 60 : obj.time_minutes) : null,
        obj.duration,
      ];
      for (const field of nestedFields) {
        const parsed = parseDurationToSeconds(field);
        if (parsed && parsed > 0) return parsed;
      }
    }
  }

  return defaultSeconds;
}

/**
 * Format seconds into a friendly human string (e.g. "3 Hours", "45 Mins", "2 Hours 15 Mins")
 */
export function formatDurationFriendly(seconds: number): string {
  const totalMins = Math.round(seconds / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} Hour${hours > 1 ? 's' : ''} ${mins} Min${mins > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} Hour${hours > 1 ? 's' : ''}`;
  }
  return `${mins} Min${mins > 1 ? 's' : ''}`;
}
