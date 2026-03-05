export type ItemType =
  | 'Objective'
  | 'SuccessFactor'
  | 'KeyResult'
  | 'Feature'
  | 'UserCapability'
  | 'Adoption'
  | 'Impact';

export type Status = 'Chưa bắt đầu' | 'Đang triển khai' | 'Hoàn thành';

export interface OkrItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  code: string | null;
  title: string;
  type: ItemType;
  sortOrder: number;
  project: string | null;
  status: Status;
  startDate: string | null;
  endDate: string | null;
  owner: string | null;
  stakeholder: string | null;
  chotFlag: string | null;
  isOptional: boolean;
  strategicPillar: string | null;
  deadline: string | null;
  pic: string | null;
  scope: string | null;
  description: string | null;
  successMetric: string | null;
  targetValue: string | null;
  measureFormula: string | null;
  corporateKRLinkage: string | null;
  notes: string | null;
  progressPct: number;
  parentId: string | null;
  children?: OkrItem[];
}

export interface DashboardChild {
  id: string;
  code: string | null;
  title: string;
  type: string;
  progressPct: number;
  project: string | null;
  status: string;
  owner: string | null;
  targetValue?: string | null;
}

export interface ObjectiveWithChildren {
  id: string;
  code: string | null;
  title: string;
  progressPct: number;
  status: string;
  children: DashboardChild[];
}

export interface RoadmapItem {
  id: string;
  title: string;
  code: string | null;
  type: string;
  project: string | null;
  status: string;
  owner: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface DashboardStats {
  totalItems: number;
  totalObjectives: number;
  totalFeatures: number;
  completedItems: number;
  inProgressItems: number;
  notStartedItems: number;
  avgObjectiveProgress: number;
  objectiveProgress: {
    id: string;
    code: string | null;
    title: string;
    progressPct: number;
  }[];
  objectivesWithChildren: ObjectiveWithChildren[];
  projectStats: {
    project: string;
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
    progressPct: number;
  }[];
  statusBreakdown: {
    status: string;
    count: number;
  }[];
  roadmapItems: RoadmapItem[];
  progressTrend: {
    series: Array<{ id: string; code: string | null; title: string; color: string; currentPct: number }>;
    points: Array<{ week: string; date: string; [key: string]: number | string }>;
  };
}
