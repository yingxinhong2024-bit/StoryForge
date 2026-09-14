// ===== 全局类型定义 =====

export type CoordinateId =
  | 'premium-web'
  | 'historical-knowledge'
  | 'speculative-depth'
  | 'literary-fiction';

/** 坐标亲和度等级：核心 > 常见 > 辅助 > 偶尔 > 罕见 */
export type Affinity = '核心' | '常见' | '辅助' | '偶尔' | '罕见';

export type CoordinateAffinity = Record<CoordinateId, Affinity>;

export interface Coordinate {
  id: CoordinateId;
  name: string;
  layer: string;
  coreLogic: string;
  evaluation: string;
  representativeWorks: string[];
  constraints: string[];
  namingStrategy: string;
}

export interface Genre {
  id: string;
  name: string;
  group: string;
  themes: string[];
  archetypes: string[];
  namingStyle: string;
  coordinateAffinity: CoordinateAffinity;
}

export interface Technique {
  id: string;
  name: string;
  category: string;
  description: string;
  useCase: string;
  combination: string[];
  coordinateAffinity: Partial<CoordinateAffinity>;
}

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  supportsVision: boolean;
  docsUrl: string;
}

export interface ModelSettings {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
}

export interface CustomTechnique {
  id: string;
  name: string;
  category: string;
  description: string;
  useCase: string;
  combination: string[];
  createdAt: number;
}

export interface HistoryRecord {
  id: string;
  title: string;
  idea: string;
  coordinate: CoordinateId;
  genres: string[];
  report: string;
  createdAt: number;
}

export interface SampleIdea {
  label: string;
  coordinate: CoordinateId;
  genres: string[];
  idea: string;
}
