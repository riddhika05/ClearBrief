export interface Location {
  name: string;
  lat?: number;
  lon?: number;
  grid?: string;
}

export interface MilitaryReport {
  id: string;
  sourceType: 'military';
  unit: string;
  channel: string;
  reportedAt: string;
  location: Location;
  text: string;
  confidence: number;
}

export interface PublicItem {
  id: string;
  sourceType: 'social' | 'news';
  platform?: string;
  publisherType?: string;
  authorType?: string;
  postedAt: string;
  claimedLocationText?: string;
  headline?: string;
  text: string;
  media?: string[];
  rawUrl: string;
}

export interface VerificationResult {
  itemId: string;
  relevance: number;
  sourceReliability: number;
  geoConsistency: number;
  crossConfirmCount: number;
  finalConfidence: number;
  label: 'Verified' | 'Unverified' | 'Suspicious';
  reasons: string[];
}

export interface Entity {
  id: string;
  type: 'event' | 'location' | 'unit' | 'person';
  name: string;
  lat?: number;
  lon?: number;
  timeStart?: string;
  timeEnd?: string;
}

export interface Relation {
  id: string;
  type: string;
  from: string;
  to: string;
  evidence?: string[];
  confidence: number;
  notes?: string;
}

export interface Conflict {
  id: string;
  severity: 'amber' | 'blue' | 'red';
  summary: string;
  items: string[];
  status: 'Open' | 'Resolved';
}

export interface SpotrepSection {
  SITUATION: string;
  LOCATION: string;
  TIME_WINDOW: string;
  FRIENDLY_FORCES: string;
  OBSERVED_ACTIVITY: string;
  CIVILIAN_SIGNALS: string;
  CONFLICTS_UNCERTAINTIES: string;
  CONFIDENCE_SUMMARY: string;
  SOURCES: string[];
}

export interface SpotrepVersion {
  id: string;
  generatedAt: string;
  timeWindow: string;
  sections: SpotrepSection;
}

export interface ChatQAPair {
  q: string;
  a: string;
  citations: string[];
}

export interface Project {
  id: string;
  name: string;
  type: string;
  region: string;
  status: 'Active' | 'Monitoring' | 'Closed';
  createdBy: string;
  createdAt: string;
  timeWindow: {
    start: string;
    end: string;
  };
  tags: string[];
  ingestionConfig: {
    keywords: string[];
    locationHint: string;
    radiusKm: number;
    sources: {
      social: boolean;
      news: boolean;
      alerts: boolean;
    };
  };
  militaryReports: MilitaryReport[];
  publicItems: PublicItem[];
  verificationResults: VerificationResult[];
  entities: Entity[];
  relations: Relation[];
  conflicts: Conflict[];
  spotrepVersions: SpotrepVersion[];
  chat: {
    suggestedPrompts: string[];
    qaPairs: ChatQAPair[];
  };
  realtimeQueue: {
    enabled: boolean;
    intervalSeconds: number;
    toastTemplate: string;
    pendingPublicItems: PublicItem[];
  };
}

export interface SourceDefaults {
  militaryDefaultConfidence: number;
  publicDefaultConfidenceRange: [number, number];
  reliabilityBySourceType: Record<string, number>;
}

export interface AppData {
  appName: string;
  demoMode: boolean;
  auth: {
    enabled: boolean;
    loginBypass: boolean;
    banner: string;
  };
  sourceDefaults: SourceDefaults;
  projects: Project[];
}
