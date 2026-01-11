export interface PersonalInfo {
  age: number | null;
  location: 'Dublin' | 'Cork' | 'Galway' | 'Limerick' | 'Other City' | 'Rural/Town' | null;
  relationship: 'Single' | 'In a relationship' | 'Married/Civil partnership' | 'Separated/Divorced' | null;
  dependents: number | null;
  personalContext: string;
}

export interface EmploymentInfo {
  employmentType: 'PAYE Employee' | 'Self-employed' | 'Contractor' | 'Mix' | 'Not working' | 'Retired' | null;
  jobSecurity: 'Very secure' | 'Fairly secure' | 'Somewhat uncertain' | 'Unstable' | null;
  industry: string;
  employmentContext: string;
}

export interface IncomeInfo {
  grossSalary: number | null;
  netMonthly: number | null;
  partnerIncome: number | null;
  additionalIncomeContext: string;
  expectedSalary3Years: number | null;
  incomeConfidence: 'Very confident' | 'Fairly confident' | 'Uncertain' | 'Expect decrease' | null;
  incomeTrajectoryContext: string;
}

export interface SavingsInfo {
  emergencyFund: number | null;
  otherSavings: number | null;
  monthlySavingsCapacity: number | null;
  savingsContext: string;
}

export interface DebtInfo {
  hasMortgage: boolean;
  mortgageBalance: number | null;
  mortgageRate: number | null;
  otherDebtTotal: number | null;
  highestDebtRate: number | null;
  debtContext: string;
}

export interface PensionInfo {
  pensionPot: number | null;
  monthlyPensionContribution: number | null;
  employerMatch: 'Full match' | 'Partial match' | 'No matching' | 'Not sure' | null;
  otherInvestments: number | null;
  pensionContext: string;
}

export interface GoalsInfo {
  selectedGoals: string[];
  goalTimelines: Record<string, string>;
  goalsContext: string;
  lifestyleValues: string[];
  lifestyleContext: string;
}

export interface RiskProfile {
  marketDropReaction: 'sell' | 'hold_anxious' | 'hold_okay' | 'buy_more' | null;
  guaranteedVsRisk: 'guaranteed' | 'fifty_fifty' | null;
  debtVsInvest: 'pay_debt' | 'split' | 'invest' | null;
  emergencyFundPreference: '6plus' | '3to6' | '3' | 'less' | null;
  presentFutureSlider: number;
  activePassiveSlider: number;
  retirementPreference: 'early_less' | 'normal_more' | null;
  bonusUsage: 'debt' | 'save' | 'invest' | 'spend' | 'mix' | null;
  riskContext: string;
}

export interface FlowchartChecklist {
  budgetTracked: boolean;
  essentialBillsPaid: boolean;
  minDebtPayments: boolean;
  switchedEnergy: boolean;
  switchedInsurance: boolean;
  switchedBroadband: boolean;
  emergencyFundStatus: 'none' | 'starter' | 'building' | 'solid' | 'strong' | null;
  pensionStatus: 'no_scheme' | 'not_enrolled' | 'partial' | 'full_match' | 'self_employed' | null;
  debtAbove5Percent: 'none' | 'small' | 'moderate' | 'significant' | null;
  propertyStatus: 'own_outright' | 'own_mortgage' | 'saving_deposit' | 'renting_happy' | 'renting_unsure' | null;
  checklistContext: string;
}

export interface FormData {
  personal: PersonalInfo;
  employment: EmploymentInfo;
  income: IncomeInfo;
  savings: SavingsInfo;
  debt: DebtInfo;
  pension: PensionInfo;
  goals: GoalsInfo;
  risk: RiskProfile;
  flowchart: FlowchartChecklist;
  finalThoughts: string;
}

export const initialFormData: FormData = {
  personal: {
    age: null,
    location: null,
    relationship: null,
    dependents: null,
    personalContext: '',
  },
  employment: {
    employmentType: null,
    jobSecurity: null,
    industry: '',
    employmentContext: '',
  },
  income: {
    grossSalary: null,
    netMonthly: null,
    partnerIncome: null,
    additionalIncomeContext: '',
    expectedSalary3Years: null,
    incomeConfidence: null,
    incomeTrajectoryContext: '',
  },
  savings: {
    emergencyFund: null,
    otherSavings: null,
    monthlySavingsCapacity: null,
    savingsContext: '',
  },
  debt: {
    hasMortgage: false,
    mortgageBalance: null,
    mortgageRate: null,
    otherDebtTotal: null,
    highestDebtRate: null,
    debtContext: '',
  },
  pension: {
    pensionPot: null,
    monthlyPensionContribution: null,
    employerMatch: null,
    otherInvestments: null,
    pensionContext: '',
  },
  goals: {
    selectedGoals: [],
    goalTimelines: {},
    goalsContext: '',
    lifestyleValues: [],
    lifestyleContext: '',
  },
  risk: {
    marketDropReaction: null,
    guaranteedVsRisk: null,
    debtVsInvest: null,
    emergencyFundPreference: null,
    presentFutureSlider: 50,
    activePassiveSlider: 50,
    retirementPreference: null,
    bonusUsage: null,
    riskContext: '',
  },
  flowchart: {
    budgetTracked: false,
    essentialBillsPaid: false,
    minDebtPayments: false,
    switchedEnergy: false,
    switchedInsurance: false,
    switchedBroadband: false,
    emergencyFundStatus: null,
    pensionStatus: null,
    debtAbove5Percent: null,
    propertyStatus: null,
    checklistContext: '',
  },
  finalThoughts: '',
};
