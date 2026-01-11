export interface PriorityAction {
  id: string;
  title: string;
  description: string;
  action: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  category: 'emergency_fund' | 'debt' | 'pension' | 'savings' | 'switching' | 'investment';
  potentialImpact: string;
}

export interface MonthlyMilestone {
  month: string;
  tasks: {
    id: string;
    task: string;
    completed: boolean;
  }[];
}

export interface YearlyGoal {
  year: number;
  goals: {
    id: string;
    goal: string;
    target: string;
    completed: boolean;
  }[];
}

export interface GeneratedPlan {
  summary: {
    riskProfile: string;
    keyStrengths: string[];
    keyAreas: string[];
  };
  priorityActions: PriorityAction[];
  monthlyMilestones: MonthlyMilestone[];
  yearlyGoals: YearlyGoal[];
  disclaimers: string[];
  generatedAt: string;
}
