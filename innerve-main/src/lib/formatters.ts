import { format, formatDistanceToNow, parseISO } from 'date-fns';

export function formatTimestamp(isoString: string): string {
  try {
    return format(parseISO(isoString), 'HH:mm:ss\'Z\'');
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    return format(parseISO(isoString), 'dd MMM yyyy');
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    return format(parseISO(isoString), 'dd MMM yyyy HH:mm:ss');
  } catch {
    return isoString;
  }
}

export function formatRelative(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true });
  } catch {
    return isoString;
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'text-public-verified';
  if (confidence >= 0.4) return 'text-public-unverified';
  return 'text-public-suspicious';
}

export function getConfidenceBg(confidence: number): string {
  if (confidence >= 0.7) return 'bg-public-verified/10';
  if (confidence >= 0.4) return 'bg-public-unverified/10';
  return 'bg-public-suspicious/10';
}

export function getLabelBadgeClass(label: 'Verified' | 'Unverified' | 'Suspicious'): string {
  switch (label) {
    case 'Verified':
      return 'badge-verified';
    case 'Unverified':
      return 'badge-unverified';
    case 'Suspicious':
      return 'badge-suspicious';
    default:
      return 'badge-unverified';
  }
}

export function getSeverityClass(severity: 'amber' | 'blue' | 'red'): string {
  switch (severity) {
    case 'amber':
      return 'severity-amber';
    case 'blue':
      return 'severity-blue';
    case 'red':
      return 'severity-red';
    default:
      return 'severity-blue';
  }
}

export function getStatusClass(status: 'Active' | 'Monitoring' | 'Closed'): string {
  switch (status) {
    case 'Active':
      return 'status-active';
    case 'Monitoring':
      return 'status-monitoring';
    case 'Closed':
      return 'status-closed';
    default:
      return 'status-monitoring';
  }
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
