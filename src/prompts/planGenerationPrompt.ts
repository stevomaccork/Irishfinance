import type { FormData } from '../types/form';

function getPensionLimit(age: number): number {
  if (age < 30) return 15;
  if (age < 40) return 20;
  if (age < 50) return 25;
  if (age < 55) return 30;
  if (age < 60) return 35;
  return 40;
}

export function buildPlanPrompt(data: FormData): string {
  const age = data.personal.age || 30;
  const halfAgePercent = Math.round(age / 2);
  const annualGross = data.income.grossSalary || 0;
  const monthlyNet = data.income.netMonthly || 0;
  const taxBand = annualGross > 42000 ? '40%' : '20%';
  const pensionLimit = getPensionLimit(age);
  const monthlyPensionContrib = data.pension.monthlyPensionContribution || 0;
  const pensionPercent = annualGross > 0 ? Math.round((monthlyPensionContrib * 12 / annualGross) * 100) : 0;
  const emergencyFund = data.savings.emergencyFund || 0;
  const emergencyMonths = monthlyNet > 0 ? (emergencyFund / monthlyNet).toFixed(1) : '0';

  const mortgageInfo = data.debt.hasMortgage
    ? '- Mortgage balance: EUR' + (data.debt.mortgageBalance || 0).toLocaleString() + '\n- Mortgage rate: ' + (data.debt.mortgageRate || 0) + '%'
    : '';

  const parts = [
    'GENERATE A PERSONALISED IRISH FINANCIAL PLAN FOR THIS USER:',
    '',
    'SECTION 1: PERSONAL PROFILE',
    'Age: ' + (data.personal.age || 'Not specified'),
    'Location: ' + (data.personal.location || 'Not specified'),
    'Relationship: ' + (data.personal.relationship || 'Not specified'),
    'Dependents: ' + (data.personal.dependents || 0),
    'Additional context: ' + (data.personal.personalContext || 'None provided'),
    '',
    'SECTION 2: EMPLOYMENT',
    'Type: ' + (data.employment.employmentType || 'Not specified'),
    'Job security: ' + (data.employment.jobSecurity || 'Not specified'),
    'Industry: ' + (data.employment.industry || 'Not specified'),
    'Additional context: ' + (data.employment.employmentContext || 'None provided'),
    '',
    'SECTION 3: INCOME',
    'Gross annual salary: EUR' + annualGross.toLocaleString(),
    'Net monthly income: EUR' + monthlyNet.toLocaleString(),
    'Tax band: ' + taxBand,
    'Partner/household income: EUR' + (data.income.partnerIncome || 0).toLocaleString() + '/year',
    'Expected salary in 3 years: EUR' + (data.income.expectedSalary3Years || 0).toLocaleString(),
    'Confidence in trajectory: ' + (data.income.incomeConfidence || 'Not specified'),
    'Additional income context: ' + (data.income.additionalIncomeContext || 'None'),
    'Career context: ' + (data.income.incomeTrajectoryContext || 'None'),
    '',
    'SECTION 4: CURRENT FINANCIAL STATE',
    'SAVINGS:',
    '- Emergency fund: EUR' + emergencyFund.toLocaleString() + ' (approx ' + emergencyMonths + ' months expenses)',
    '- Other savings: EUR' + (data.savings.otherSavings || 0).toLocaleString(),
    '- Monthly savings capacity: EUR' + (data.savings.monthlySavingsCapacity || 0).toLocaleString(),
    '- Context: ' + (data.savings.savingsContext || 'None'),
    '',
    'DEBT:',
    '- Has mortgage: ' + (data.debt.hasMortgage ? 'Yes' : 'No'),
    mortgageInfo,
    '- Other debt total: EUR' + (data.debt.otherDebtTotal || 0).toLocaleString(),
    '- Highest debt interest rate: ' + (data.debt.highestDebtRate || 0) + '%',
    '- Context: ' + (data.debt.debtContext || 'None'),
    '',
    'PENSION & INVESTMENTS:',
    '- Current pension pot: EUR' + (data.pension.pensionPot || 0).toLocaleString(),
    '- Monthly pension contribution: EUR' + monthlyPensionContrib.toLocaleString() + ' (' + pensionPercent + '% of salary)',
    '- Target for age ' + age + ': ' + halfAgePercent + '% of salary',
    '- Max tax-relieved contribution: ' + pensionLimit + '% of earnings (EUR' + Math.round(annualGross * pensionLimit / 100).toLocaleString() + '/year)',
    '- Employer matching: ' + (data.pension.employerMatch || 'Not specified'),
    '- Other investments: EUR' + (data.pension.otherInvestments || 0).toLocaleString(),
    '- Context: ' + (data.pension.pensionContext || 'None'),
    '',
    'SECTION 5: GOALS',
    'Selected goals: ' + (data.goals.selectedGoals.length > 0 ? data.goals.selectedGoals.join(', ') : 'None selected'),
    'Goal details: ' + (data.goals.goalsContext || 'None provided'),
    'Lifestyle values: ' + (data.goals.lifestyleValues.length > 0 ? data.goals.lifestyleValues.join(', ') : 'None selected'),
    'Values context: ' + (data.goals.lifestyleContext || 'None provided'),
    '',
    'SECTION 6: RISK PROFILE',
    'Market drop reaction: ' + (data.risk.marketDropReaction || 'Not answered'),
    'Guaranteed vs risk preference: ' + (data.risk.guaranteedVsRisk || 'Not answered'),
    'Debt vs invest preference: ' + (data.risk.debtVsInvest || 'Not answered'),
    'Emergency fund preference: ' + (data.risk.emergencyFundPreference || 'Not answered'),
    'Present vs future slider: ' + data.risk.presentFutureSlider + '/100 (0=enjoy now, 100=sacrifice for future)',
    'Active vs passive slider: ' + data.risk.activePassiveSlider + '/100 (0=set and forget, 100=actively manage)',
    'Retirement preference: ' + (data.risk.retirementPreference || 'Not answered'),
    'Bonus usage instinct: ' + (data.risk.bonusUsage || 'Not answered'),
    'Risk context: ' + (data.risk.riskContext || 'None provided'),
    '',
    'SECTION 7: FLOWCHART CHECKLIST STATUS',
    'Budget tracked: ' + (data.flowchart.budgetTracked ? 'Yes' : 'No'),
    'Essential bills paid: ' + (data.flowchart.essentialBillsPaid ? 'Yes' : 'No'),
    'Min debt payments: ' + (data.flowchart.minDebtPayments ? 'Yes' : 'No'),
    'Switched energy (last 12mo): ' + (data.flowchart.switchedEnergy ? 'Yes' : 'No'),
    'Switched insurance: ' + (data.flowchart.switchedInsurance ? 'Yes' : 'No'),
    'Switched broadband: ' + (data.flowchart.switchedBroadband ? 'Yes' : 'No'),
    'Emergency fund status: ' + (data.flowchart.emergencyFundStatus || 'Not specified'),
    'Pension status: ' + (data.flowchart.pensionStatus || 'Not specified'),
    'Debt above 5%: ' + (data.flowchart.debtAbove5Percent || 'Not specified'),
    'Property status: ' + (data.flowchart.propertyStatus || 'Not specified'),
    'Additional context: ' + (data.flowchart.checklistContext || 'None'),
    '',
    'SECTION 8: FINAL THOUGHTS FROM USER',
    data.finalThoughts || 'None provided',
    '',
    'Based on all the above information, generate a comprehensive personalised financial plan.',
    'Respond ONLY with valid JSON matching this structure:',
    JSON.stringify({
      summary: {
        riskProfile: "string describing their investor type",
        keyStrengths: ["array of 2-3 things they're doing well"],
        keyAreas: ["array of 2-3 areas for improvement"]
      },
      priorityActions: [{
        id: "unique_id",
        title: "Action title",
        description: "Why this matters",
        action: "Specific next step",
        urgency: "critical|high|medium|low",
        category: "emergency_fund|debt|pension|savings|switching|investment",
        potentialImpact: "e.g., Save EUR500/year"
      }],
      monthlyMilestones: [{
        month: "Month Year",
        tasks: [{ id: "unique_id", task: "Specific task", completed: false }]
      }],
      yearlyGoals: [{
        year: 2026,
        goals: [{ id: "unique_id", goal: "Goal description", target: "EURX or X%", completed: false }]
      }],
      disclaimers: ["Standard disclaimer 1", "Standard disclaimer 2"]
    }, null, 2)
  ];

  return parts.join('\n');
}
