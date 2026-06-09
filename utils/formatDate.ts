import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr as locale } from 'date-fns/locale';

export const formatDate = (dateStr: string, fmt = 'dd/MM/yyyy'): string => {
  try {
    return format(parseISO(dateStr), fmt, { locale });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  return formatDate(dateStr, 'dd/MM/yyyy HH:mm');
};

export const formatTime = (dateStr: string): string => {
  return formatDate(dateStr, 'HH:mm');
};

export const formatRelative = (dateStr: string): string => {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true, locale });
  } catch {
    return dateStr;
  }
};

export const getDateRange = (range: 'today' | 'week' | 'month'): { start: string; end: string } => {
  const now = new Date();
  const end = format(now, 'yyyy-MM-dd');

  let start: string;
  switch (range) {
    case 'today':
      start = end;
      break;
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start = format(weekAgo, 'yyyy-MM-dd');
      break;
    case 'month':
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start = format(monthAgo, 'yyyy-MM-dd');
      break;
    default:
      start = end;
  }

  return { start, end };
};

export const formatDateShort = (dateStr: string): string => {
  return formatDate(dateStr, 'dd/MM');
};
