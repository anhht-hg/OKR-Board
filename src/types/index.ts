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
  completedAt: string | null;
  owner: string | null;
  stakeholder: string | null;
  chotFlag: string | null;
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
  progressPct: number;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  parentId: string | null;
}

export interface FeatureDeliveryStats {
  totalFeatures: number;
  totalUC: number;
  completedFeatures: number;
  inProgressFeatures: number;
  notStartedFeatures: number;
  completedUC: number;
  inProgressUC: number;
  pctFeatures: number;
  pctUC: number;
  avgDeliveryPct: number;
}

export interface BusinessOutcomesStats {
  totalSF: number;
  totalKR: number;
  totalOutcomes: number;
  totalAdoption: number;
  totalImpact: number;
  completedSF: number;
  completedKR: number;
  completedOutcomes: number;
  completedAdoption: number;
  completedImpact: number;
  pctSF: number;
  pctKR: number;
  pctOutcomes: number;
  avgOutcomePct: number;
  avgAdoptionPct: number;
  avgImpactPct: number;
}

export interface ObjectiveTrackBreakdown {
  id: string;
  code: string | null;
  title: string;
  progressPct: number;
  deliveryPct: number;
  outcomePct: number;
}

export interface RawItem {
  id: string;
  title: string;
  code: string | null;
  type: string;
  status: string;
  progressPct: number;
  project: string | null;
  owner: string | null;
  chotFlag: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  parentId: string | null;
}

// ─── Action Plan types ───────────────────────────────────────────────────────

export type ActionItemStatus = 'Chưa triển khai' | 'Đang làm' | 'Hoàn thành';

export interface ActionItem {
  id: string;
  goalId: string;
  sortOrder: number;
  task: string;
  expectedResult: string | null;
  pic: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ActionItemStatus;
  budget: string | null;
  okrLinkage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyGoal {
  id: string;
  planId: string;
  sortOrder: number;
  title: string;
  okrLinkage: string | null;
  expectedResult: string | null;
  actionItems: ActionItem[];
}

export interface KpiItem {
  id: string;
  planId: string;
  sortOrder: number;
  metric: string;
  target: string | null;
  actual: string | null;
  note: string | null;
}

export interface ActionPlan {
  id: string;
  month: number;
  year: number;
  title: string;
  notes: string | null;
  goals: MonthlyGoal[];
  kpis: KpiItem[];
}

export interface ActionPlanSummary {
  id: string;
  month: number;
  year: number;
  title: string;
  _count: { goals: number; kpis: number };
}

// ─────────────────────────────────────────────────────────────────────────────

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
  featureDelivery: FeatureDeliveryStats;
  businessOutcomes: BusinessOutcomesStats;
  deliveryByObjective: ObjectiveTrackBreakdown[];
  rawItems: RawItem[];
}
