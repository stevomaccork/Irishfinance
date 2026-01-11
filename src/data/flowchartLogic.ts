import type { FormData } from '../types/form';
import type { PriorityAction, GeneratedPlan, MonthlyMilestone, YearlyGoal } from '../types/plan';

/**
 * Generates recommendations based purely on flowchart logic
 * Used when user doesn't have/want to use an API key
 */
export function generateRuleBasedRecommendations(data: FormData): PriorityAction[] {
  const recommendations: PriorityAction[] = [];
  const monthlyNet = data.income.netMonthly || 0;

  // 1. Check budgeting
  if (!data.flowchart.budgetTracked) {
    recommendations.push({
      id: 'budget',
      title: 'Start Tracking Your Expenses',
      description: "You can't optimise what you don't measure. This is the foundation of all financial planning.",
      action: 'Download a budgeting app or create a spreadsheet. Review your last 3 months of bank statements.',
      urgency: 'high',
      category: 'savings',
      potentialImpact: 'Find €200-500/month in "leaks"',
    });
  }

  // 2. Check provider switching
  if (!data.flowchart.switchedEnergy) {
    recommendations.push({
      id: 'switch_energy',
      title: 'Switch Energy Provider',
      description: 'New customer deals are almost always better than loyalty rates.',
      action: 'Use Bonkers.ie to compare energy providers. Takes 10 minutes.',
      urgency: 'medium',
      category: 'switching',
      potentialImpact: 'Save €300-500/year',
    });
  }

  if (!data.flowchart.switchedInsurance) {
    recommendations.push({
      id: 'switch_insurance',
      title: 'Shop Around for Insurance',
      description: 'Car, home, and health insurance should be compared annually.',
      action: 'Get quotes from at least 3 providers before your next renewal.',
      urgency: 'medium',
      category: 'switching',
      potentialImpact: 'Save €200-400/year',
    });
  }

  // 3. Check emergency fund
  const emergencyFund = data.savings.emergencyFund || 0;
  const emergencyMonths = monthlyNet > 0 ? emergencyFund / monthlyNet : 0;

  if (emergencyMonths < 1) {
    recommendations.push({
      id: 'emergency_starter',
      title: 'Build Starter Emergency Fund',
      description: "You need at least €1,000 or 1 month's expenses before anything else.",
      action: `Target: €${Math.max(1000, monthlyNet).toLocaleString()}. Set up automatic transfer on payday.`,
      urgency: 'critical',
      category: 'emergency_fund',
      potentialImpact: 'Avoid going into debt for emergencies',
    });
  } else if (emergencyMonths < 3) {
    recommendations.push({
      id: 'emergency_build',
      title: 'Build Full Emergency Fund',
      description: `You have ${emergencyMonths.toFixed(1)} months saved. Target is 3-6 months.`,
      action: `Target: €${(monthlyNet * 3).toLocaleString()} minimum. Keep in easy-access savings account.`,
      urgency: 'high',
      category: 'emergency_fund',
      potentialImpact: 'Complete financial security',
    });
  }

  // 4. Check pension matching - THIS IS CRITICAL
  if (data.flowchart.pensionStatus === 'partial' || data.pension.employerMatch === 'Partial match') {
    recommendations.push({
      id: 'pension_match',
      title: 'Get Your Full Pension Match!',
      description: "You're leaving FREE MONEY on the table. This is an instant 100% return.",
      action: 'Contact HR immediately to increase your contribution to get the full employer match.',
      urgency: 'critical',
      category: 'pension',
      potentialImpact: 'Instant 100% return on contributions',
    });
  }

  if (data.flowchart.pensionStatus === 'not_enrolled') {
    recommendations.push({
      id: 'pension_enroll',
      title: 'Enroll in Your Employer Pension',
      description: "You have access to a pension scheme but aren't enrolled. You're missing tax relief and likely employer matching.",
      action: 'Contact HR to enroll. Ask about employer matching.',
      urgency: 'critical',
      category: 'pension',
      potentialImpact: 'Tax relief + potential matching',
    });
  }

  // 5. Check high interest debt
  const highestRate = data.debt.highestDebtRate || 0;
  const otherDebt = data.debt.otherDebtTotal || 0;

  if (highestRate > 5 && otherDebt > 0) {
    recommendations.push({
      id: 'high_debt',
      title: 'Attack High-Interest Debt',
      description: `You have debt at ${highestRate}% interest. This should be a priority.`,
      action: 'List all debts by interest rate. Pay minimums on all, then attack highest rate first (Avalanche method).',
      urgency: highestRate > 10 ? 'critical' : 'high',
      category: 'debt',
      potentialImpact: `Save ${highestRate}% guaranteed "return"`,
    });
  }

  // 6. Check pension contribution rate
  const age = data.personal.age || 30;
  const targetPensionPercent = Math.round(age / 2);
  const grossSalary = data.income.grossSalary || 0;
  const monthlyPension = data.pension.monthlyPensionContribution || 0;
  const currentPensionPercent = grossSalary > 0
    ? Math.round((monthlyPension * 12 / grossSalary) * 100)
    : 0;

  if (currentPensionPercent < targetPensionPercent && data.flowchart.pensionStatus !== 'partial') {
    recommendations.push({
      id: 'pension_increase',
      title: 'Increase Pension Contributions',
      description: `At age ${age}, aim for ${targetPensionPercent}% of salary. You're at ${currentPensionPercent}%.`,
      action: `Increase by 1-2% per year until you reach ${targetPensionPercent}%. Tax relief makes this efficient.`,
      urgency: 'medium',
      category: 'pension',
      potentialImpact: `${grossSalary > 42000 ? '40%' : '20%'} tax relief on contributions`,
    });
  }

  // 7. Property saving advice
  if (data.flowchart.propertyStatus === 'saving_deposit') {
    recommendations.push({
      id: 'property_saving',
      title: 'House Deposit Strategy',
      description: 'Balance between deposit savings and pension contributions.',
      action: 'Check Help to Buy scheme (up to €30k for first-time buyers). Ensure you still get pension match.',
      urgency: 'low',
      category: 'savings',
      potentialImpact: 'Up to €30k from Help to Buy',
    });
  }

  // Sort by urgency
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return recommendations.slice(0, 5); // Top 5 priorities
}

/**
 * Generate a complete rule-based plan without using an LLM
 */
export function generateRuleBasedPlan(data: FormData): GeneratedPlan {
  const age = data.personal.age || 30;
  const monthlyNet = data.income.netMonthly || 0;
  const monthlyPension = data.pension.monthlyPensionContribution || 0;
  const emergencyFund = data.savings.emergencyFund || 0;
  const pensionPot = data.pension.pensionPot || 0;

  // Calculate risk profile based on answers
  let riskScore = 0;
  if (data.risk.marketDropReaction === 'buy_more') riskScore += 3;
  else if (data.risk.marketDropReaction === 'hold_okay') riskScore += 2;
  else if (data.risk.marketDropReaction === 'hold_anxious') riskScore += 1;

  if (data.risk.guaranteedVsRisk === 'fifty_fifty') riskScore += 2;

  if (data.risk.debtVsInvest === 'invest') riskScore += 2;
  else if (data.risk.debtVsInvest === 'split') riskScore += 1;

  let riskProfile = 'Balanced Saver';
  if (riskScore >= 6) riskProfile = 'Growth-Focused Investor';
  else if (riskScore >= 4) riskProfile = 'Balanced Investor';
  else if (riskScore >= 2) riskProfile = 'Security-Focused Saver';
  else riskProfile = 'Conservative Saver';

  // Key strengths
  const keyStrengths: string[] = [];
  if (data.flowchart.budgetTracked) keyStrengths.push('Tracking expenses and budgeting');
  if (data.flowchart.essentialBillsPaid) keyStrengths.push('Essential bills are covered');
  if (emergencyFund >= monthlyNet * 3) keyStrengths.push('Solid emergency fund in place');
  if (data.pension.employerMatch === 'Full match') keyStrengths.push('Maximising employer pension match');
  if (keyStrengths.length === 0) keyStrengths.push("Taking steps to improve your financial health");

  // Key areas for improvement
  const keyAreas: string[] = [];
  if (!data.flowchart.budgetTracked) keyAreas.push('Start tracking income and expenses');
  if (emergencyFund < monthlyNet * 3) keyAreas.push('Build up emergency fund to 3-6 months');
  if (data.pension.employerMatch === 'Partial match') keyAreas.push('Get full employer pension match');
  if ((data.debt.highestDebtRate || 0) > 5) keyAreas.push('Pay down high-interest debt');
  if (keyAreas.length === 0) keyAreas.push('Continue building towards your goals');

  // Priority actions
  const priorityActions = generateRuleBasedRecommendations(data);

  // Monthly milestones
  const currentDate = new Date();
  const monthlyMilestones: MonthlyMilestone[] = [];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    const tasks: MonthlyMilestone['tasks'] = [];

    if (i === 0) {
      if (!data.flowchart.budgetTracked) {
        tasks.push({ id: `m${i}_budget`, task: 'Set up expense tracking system', completed: false });
      }
      if (!data.flowchart.switchedEnergy) {
        tasks.push({ id: `m${i}_energy`, task: 'Compare energy providers on Bonkers.ie', completed: false });
      }
      tasks.push({ id: `m${i}_savings`, task: `Set up automatic €${data.savings.monthlySavingsCapacity || 500}/month transfer to savings`, completed: false });
    } else if (i === 1) {
      if (!data.flowchart.switchedInsurance) {
        tasks.push({ id: `m${i}_insurance`, task: 'Get quotes for car/home insurance', completed: false });
      }
      if (data.flowchart.pensionStatus === 'partial') {
        tasks.push({ id: `m${i}_pension`, task: 'Contact HR to increase pension contribution', completed: false });
      }
      tasks.push({ id: `m${i}_review`, task: 'Review first month of expense tracking', completed: false });
    } else if (i === 2) {
      tasks.push({ id: `m${i}_review`, task: 'Review Q1 progress and adjust plan if needed', completed: false });
      tasks.push({ id: `m${i}_emergency`, task: `Emergency fund check: target €${(monthlyNet * 3).toLocaleString()}`, completed: false });
    } else if (i === 3) {
      tasks.push({ id: `m${i}_tax`, task: 'Review tax situation - any reliefs being missed?', completed: false });
      if ((data.debt.highestDebtRate || 0) > 5) {
        tasks.push({ id: `m${i}_debt`, task: 'Assess debt repayment progress', completed: false });
      }
    } else if (i === 4) {
      tasks.push({ id: `m${i}_pension_review`, task: 'Review pension performance and allocation', completed: false });
      tasks.push({ id: `m${i}_goals`, task: 'Check progress towards stated goals', completed: false });
    } else if (i === 5) {
      tasks.push({ id: `m${i}_half_year`, task: 'Half-year financial review', completed: false });
      tasks.push({ id: `m${i}_adjust`, task: 'Adjust savings rate if income has changed', completed: false });
    }

    monthlyMilestones.push({
      month: `${monthName} ${year}`,
      tasks,
    });
  }

  // Yearly goals
  const currentYear = currentDate.getFullYear();
  const yearlyGoals: YearlyGoal[] = [
    {
      year: currentYear,
      goals: [
        {
          id: 'y1_emergency',
          goal: 'Build full emergency fund',
          target: `€${(monthlyNet * 6).toLocaleString()}`,
          completed: false,
        },
        {
          id: 'y1_pension',
          goal: 'Optimise pension contributions',
          target: `${Math.round(age / 2)}% of salary`,
          completed: false,
        },
        {
          id: 'y1_debt',
          goal: 'Clear all debt above 5% interest',
          target: '€0 high-interest debt',
          completed: false,
        },
      ],
    },
    {
      year: currentYear + 1,
      goals: [
        {
          id: 'y2_savings',
          goal: 'Build additional savings beyond emergency fund',
          target: `€${(monthlyNet * 12 * 0.2).toLocaleString()}`,
          completed: false,
        },
        {
          id: 'y2_invest',
          goal: 'Consider starting taxable investments',
          target: 'Open investment account',
          completed: false,
        },
        {
          id: 'y2_networth',
          goal: 'Net worth milestone',
          target: `€${(pensionPot + emergencyFund + 30000).toLocaleString()}`,
          completed: false,
        },
      ],
    },
    {
      year: currentYear + 2,
      goals: [
        {
          id: 'y3_pension',
          goal: 'Pension pot milestone',
          target: `€${(pensionPot + monthlyPension * 36).toLocaleString()}`,
          completed: false,
        },
        {
          id: 'y3_property',
          goal: data.flowchart.propertyStatus === 'saving_deposit' ? 'Achieve house deposit target' : 'Review property/mortgage strategy',
          target: data.flowchart.propertyStatus === 'saving_deposit' ? '€50,000 deposit' : 'Optimise mortgage',
          completed: false,
        },
      ],
    },
  ];

  const disclaimers = [
    'This is educational guidance only, not regulated financial advice.',
    'For personal advice, consult a qualified financial advisor.',
    'Tax rules and limits are subject to change - verify with Revenue.ie.',
    'Past investment performance does not guarantee future results.',
  ];

  return {
    summary: {
      riskProfile,
      keyStrengths: keyStrengths.slice(0, 3),
      keyAreas: keyAreas.slice(0, 3),
    },
    priorityActions,
    monthlyMilestones,
    yearlyGoals,
    disclaimers,
    generatedAt: new Date().toISOString(),
  };
}
