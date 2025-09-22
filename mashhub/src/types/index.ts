export interface Song {
    id: string;
    title: string;
    bpms: number[];
    keys: string[];
    part: string;
    artist: string;
    type: string;
    origin: string;
    year: number;
    season: string;
    vocalStatus: 'Vocal' | 'Instrumental' | 'Both' | 'Pending';
    primaryBpm?: number;
    primaryKey?: string;
  }
  
  export interface Project {
    id: string;
    name: string;
    createdAt: Date;
  }
  
  export interface ProjectEntry {
    id: string;
    projectId: string;
    songId: string;
    sectionName: string;
    orderIndex: number;
  }
  
  export interface FilterOptions {
    searchText: string;
    bpmRange: [number, number];
    keyTolerance: number;
    targetKey?: string;
    vocalStatus?: string;
  }