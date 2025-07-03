import { addDays, differenceInDays, format, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns";

export interface TimelineItem {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: 'requirement' | 'allocation' | 'leave' | 'gap';
  percentage?: number;
  color?: string;
  metadata?: any;
}

export interface TimelineConfig {
  startDate: Date;
  endDate: Date;
  granularity: 'week' | 'month';
  showWeekends?: boolean;
}

export function generateTimelineColumns(config: TimelineConfig) {
  const { startDate, endDate, granularity } = config;
  
  if (granularity === 'week') {
    return eachWeekOfInterval(
      { start: startOfWeek(startDate), end: endOfWeek(endDate) },
      { weekStartsOn: 1 } // Monday
    ).map(date => ({
      date,
      label: format(date, 'MMM dd'),
      fullLabel: format(date, 'MMM dd, yyyy'),
    }));
  } else {
    return eachMonthOfInterval(
      { start: startOfMonth(startDate), end: endOfMonth(endDate) }
    ).map(date => ({
      date,
      label: format(date, 'MMM yyyy'),
      fullLabel: format(date, 'MMMM yyyy'),
    }));
  }
}

export function calculateItemPosition(
  item: TimelineItem,
  timelineStart: Date,
  timelineEnd: Date,
  totalWidth: number
): { left: number; width: number } {
  const totalDays = differenceInDays(timelineEnd, timelineStart);
  const itemStartDays = Math.max(0, differenceInDays(item.startDate, timelineStart));
  const itemEndDays = Math.min(totalDays, differenceInDays(item.endDate, timelineStart));
  const itemDuration = Math.max(1, itemEndDays - itemStartDays);
  
  const left = (itemStartDays / totalDays) * totalWidth;
  const width = (itemDuration / totalDays) * totalWidth;
  
  return { left, width };
}

export function getTimelineItemColor(type: string, percentage?: number): string {
  switch (type) {
    case 'requirement':
      return 'bg-blue-200 border-blue-400';
    case 'allocation':
      if (percentage && percentage > 100) {
        return 'bg-red-200 border-red-400';
      } else if (percentage && percentage >= 80) {
        return 'bg-green-200 border-green-400';
      } else {
        return 'bg-yellow-200 border-yellow-400';
      }
    case 'leave':
      return 'bg-purple-200 border-purple-400';
    case 'gap':
      return 'bg-red-100 border-red-300 border-dashed';
    default:
      return 'bg-gray-200 border-gray-400';
  }
}

export function groupTimelineItems(items: TimelineItem[]): TimelineItem[][] {
  // Group overlapping items into rows to avoid visual conflicts
  const rows: TimelineItem[][] = [];
  
  const sortedItems = [...items].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  
  for (const item of sortedItems) {
    let placed = false;
    
    // Try to place in existing row
    for (const row of rows) {
      const hasOverlap = row.some(existingItem => 
        item.startDate < existingItem.endDate && item.endDate > existingItem.startDate
      );
      
      if (!hasOverlap) {
        row.push(item);
        placed = true;
        break;
      }
    }
    
    // Create new row if couldn't place in existing ones
    if (!placed) {
      rows.push([item]);
    }
  }
  
  return rows;
}

export function getDefaultTimelineRange(): { startDate: Date; endDate: Date } {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1); // 2 months ago
  const endDate = new Date(now.getFullYear(), now.getMonth() + 4, 0); // 4 months from now
  
  return { startDate, endDate };
}

export function formatTimelineTooltip(item: TimelineItem): string {
  const duration = differenceInDays(item.endDate, item.startDate) + 1;
  let tooltip = `${item.title}\n${format(item.startDate, 'MMM dd')} - ${format(item.endDate, 'MMM dd')} (${duration} days)`;
  
  if (item.percentage) {
    tooltip += `\n${item.percentage}% allocation`;
  }
  
  return tooltip;
}
