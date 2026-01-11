import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Target,
  Shield,
  TrendingUp,
  Home,
  Wallet,
  PiggyBank,
  AlertCircle,
  CheckCircle2,
  Circle,
  ExternalLink,
  User,
  Briefcase,
  Heart,
  Scale,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Download,
  Menu,
  X,
} from 'lucide-react';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useLLMGeneration } from '@/hooks/useLLMGeneration';
import { generateRuleBasedPlan } from '@/data/flowchartLogic';
import type { GeneratedPlan } from '@/types/plan';
import type { FormData } from '@/types/form';
import { storage } from '@/utils/storage';

type SectionId = 'about' | 'income' | 'current_state' | 'goals' | 'risk' | 'flowchart' | 'generate';

interface Section {
  id: SectionId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  steps: Step[];
}

interface Step {
  id: string;
  title: string;
  type?: string;
  fields?: Field[];
  contextPrompt?: string;
  education?: Education;
  presets?: Preset[];
  options?: Option[];
  question?: string;
  scenarios?: Scenario[];
  questions?: SliderQuestion[];
  items?: ChecklistItem[];
}

interface Field {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  options?: string[];
  optional?: boolean;
  conditional?: string;
}

interface Education {
  title: string;
  content: string;
  link: string;
}

interface Preset {
  id: string;
  label: string;
  icon: string;
}

interface Option {
  id?: string;
  value?: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  score?: number | string;
}

interface Scenario {
  id: string;
  question: string;
  options: Option[];
}

interface SliderQuestion {
  id: string;
  label: string;
  leftLabel: string;
  rightLabel: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  help: string;
}

const sections: Section[] = [
  {
    id: 'about',
    title: 'About You',
    icon: User,
    description: "Let's start with the basics",
    steps: [
      {
        id: 'personal_basics',
        title: 'The Basics',
        fields: [
          { id: 'age', label: 'Age', type: 'number', placeholder: '30' },
          { id: 'location', label: 'Where do you live?', type: 'select', options: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Other City', 'Rural/Town'] },
          { id: 'relationship', label: 'Relationship status', type: 'select', options: ['Single', 'In a relationship', 'Married/Civil partnership', 'Separated/Divorced'] },
          { id: 'dependents', label: 'Number of dependents', type: 'number', placeholder: '0' },
        ],
        contextPrompt: 'Anything else about your personal situation that might be relevant?',
      },
      {
        id: 'employment',
        title: 'Employment Situation',
        fields: [
          { id: 'employment_type', label: 'Employment type', type: 'select', options: ['PAYE Employee', 'Self-employed', 'Contractor', 'Mix of employment types', 'Currently not working', 'Retired'] },
          { id: 'job_security', label: 'How secure does your job feel?', type: 'select', options: ['Very secure', 'Fairly secure', 'Somewhat uncertain', 'Unstable'] },
          { id: 'industry', label: 'Industry', type: 'text', placeholder: 'e.g., Tech, Healthcare, Finance...' },
        ],
        contextPrompt: 'Tell us more about your work situation - any upcoming changes?',
      },
    ],
  },
  {
    id: 'income',
    title: 'Income Picture',
    icon: Briefcase,
    description: "Understanding what's coming in",
    steps: [
      {
        id: 'current_income',
        title: 'Current Income',
        fields: [
          { id: 'gross_salary', label: 'Gross annual salary (EUR)', type: 'number', placeholder: '65000' },
          { id: 'net_monthly', label: 'Net monthly income (EUR)', type: 'number', placeholder: '3800' },
          { id: 'partner_income', label: 'Partner/household income (EUR/year)', type: 'number', placeholder: '0', optional: true },
        ],
        contextPrompt: 'Any additional income sources?',
      },
      {
        id: 'income_trajectory',
        title: 'Future Income',
        fields: [
          { id: 'expected_growth', label: 'Expected salary in 3 years (EUR)', type: 'number', placeholder: '80000' },
          { id: 'income_confidence', label: 'How confident are you in this?', type: 'select', options: ['Very confident', 'Fairly confident', 'Uncertain', 'Expect decrease'] },
        ],
        contextPrompt: "What's driving your income expectations?",
      },
    ],
  },
  {
    id: 'current_state',
    title: 'Financial Snapshot',
    icon: Wallet,
    description: 'Where you stand today',
    steps: [
      {
        id: 'savings',
        title: 'Savings & Emergency Fund',
        fields: [
          { id: 'emergency_fund', label: 'Emergency fund amount (EUR)', type: 'number', placeholder: '5000' },
          { id: 'other_savings', label: 'Other savings (EUR)', type: 'number', placeholder: '2000' },
          { id: 'monthly_savings', label: 'How much can you save monthly? (EUR)', type: 'number', placeholder: '500' },
        ],
        contextPrompt: 'What are these savings earmarked for?',
        education: {
          title: 'Emergency Fund Basics',
          content: "An emergency fund should cover 3-6 months of essential expenses. Keep it accessible - a current account or instant-access savings.",
          link: 'https://www.ccpc.ie/consumers/money/saving/',
        },
      },
      {
        id: 'debts',
        title: 'Debts & Liabilities',
        fields: [
          { id: 'has_mortgage', label: 'Do you have a mortgage?', type: 'select', options: ['Yes', 'No'] },
          { id: 'mortgage_balance', label: 'Mortgage balance (EUR)', type: 'number', placeholder: '250000', conditional: 'has_mortgage:Yes' },
          { id: 'mortgage_rate', label: 'Mortgage interest rate (%)', type: 'number', placeholder: '3.5', conditional: 'has_mortgage:Yes' },
          { id: 'other_debt', label: 'Other debts total (EUR)', type: 'number', placeholder: '0' },
          { id: 'highest_debt_rate', label: 'Highest interest rate on other debt (%)', type: 'number', placeholder: '0' },
        ],
        contextPrompt: 'List your debts with amounts and interest rates',
        education: {
          title: 'Good Debt vs Bad Debt',
          content: "Not all debt is equal. A mortgage at 3.5% is very different from credit card debt at 22%. Generally, anything above 5% should be prioritised for payoff.",
          link: 'https://www.ccpc.ie/consumers/money/borrowing/',
        },
      },
      {
        id: 'pension_current',
        title: 'Pension & Investments',
        fields: [
          { id: 'pension_pot', label: 'Current pension pot value (EUR)', type: 'number', placeholder: '25000' },
          { id: 'pension_contribution', label: 'Monthly pension contribution (EUR)', type: 'number', placeholder: '300' },
          { id: 'employer_match', label: 'Does your employer match contributions?', type: 'select', options: ['Yes, and I get full match', 'Yes, but not maximising it', 'No matching available', 'Not sure'] },
          { id: 'other_investments', label: 'Other investments value (EUR)', type: 'number', placeholder: '0' },
        ],
        contextPrompt: 'Tell us about your pension setup and any other investments',
        education: {
          title: 'Irish Pension Tax Relief',
          content: "Pension contributions get tax relief at your marginal rate. If you're in the 40% bracket, EUR100 into your pension only \"costs\" EUR60. Plus employer matching is literally free money.",
          link: 'https://www.revenue.ie/en/jobs-and-pensions/pensions/tax-relief-for-pension-contributions.aspx',
        },
      },
    ],
  },
  {
    id: 'goals',
    title: 'Goals & Dreams',
    icon: Target,
    description: 'What are you working towards?',
    steps: [
      {
        id: 'big_goals',
        title: 'Major Goals',
        type: 'goals_input',
        presets: [
          { id: 'buy_home', label: 'Buy a home', icon: '🏠' },
          { id: 'retirement_early', label: 'Retire early', icon: '🏖️' },
          { id: 'financial_freedom', label: 'Financial independence', icon: '🦅' },
          { id: 'children_education', label: "Fund children's education", icon: '🎓' },
          { id: 'start_business', label: 'Start a business', icon: '🚀' },
          { id: 'travel', label: 'Travel more', icon: '✈️' },
          { id: 'career_break', label: 'Take a career break', icon: '🧘' },
          { id: 'pay_off_mortgage', label: 'Pay off mortgage early', icon: '🔑' },
        ],
        contextPrompt: 'Describe your goals in more detail',
      },
      {
        id: 'lifestyle_wants',
        title: 'Lifestyle & Wellbeing',
        type: 'multiselect',
        question: 'What matters most to you?',
        options: [
          { id: 'security', label: 'Financial security - never worry about money', icon: Shield },
          { id: 'freedom', label: 'Freedom - work because I want to', icon: Sparkles },
          { id: 'experiences', label: 'Experiences - travel, dining, events', icon: Heart },
          { id: 'comfort', label: 'Comfort - nice home, car, lifestyle', icon: Home },
          { id: 'generosity', label: 'Generosity - help family and causes', icon: Heart },
          { id: 'growth', label: 'Growth - invest in myself', icon: TrendingUp },
        ],
        contextPrompt: 'What does "financial success" actually mean to you?',
      },
    ],
  },
  {
    id: 'risk',
    title: 'Risk Profile',
    icon: Scale,
    description: 'Understanding your comfort zone',
    steps: [
      {
        id: 'investment_risk',
        title: 'Investment Tolerance',
        type: 'scenario',
        scenarios: [
          {
            id: 'market_drop',
            question: "You invest EUR10,000. A month later, it's worth EUR7,000. What do you do?",
            options: [
              { value: 'sell', label: "Sell everything - I can't handle this", score: 1 },
              { value: 'hold_anxious', label: 'Hold but feel sick about it', score: 2 },
              { value: 'hold_okay', label: "Hold - this is normal, it'll recover", score: 3 },
              { value: 'buy_more', label: 'Buy more - stocks are on sale!', score: 4 },
            ],
          },
          {
            id: 'guaranteed_vs_risk',
            question: 'Choose one:',
            options: [
              { value: 'guaranteed', label: 'EUR1,000 guaranteed', score: 1 },
              { value: 'fifty_fifty', label: '50% chance of EUR2,500, 50% chance of EUR0', score: 3 },
            ],
          },
        ],
        contextPrompt: 'Tell us more about your relationship with financial risk',
      },
      {
        id: 'debt_comfort',
        title: 'Debt & Security',
        type: 'scenario',
        scenarios: [
          {
            id: 'debt_vs_invest',
            question: "You have EUR10k and a loan at 4% interest. Investment returns average 7%. Do you:",
            options: [
              { value: 'pay_debt', label: 'Pay off the loan - I hate owing money', score: 1 },
              { value: 'split', label: 'Split it - half to debt, half invested', score: 2 },
              { value: 'invest', label: "Invest it all - the maths says I'll come out ahead", score: 3 },
            ],
          },
          {
            id: 'emergency_fund_size',
            question: 'How much emergency fund feels "safe" to you?',
            options: [
              { value: '6plus', label: '6+ months - I need a big buffer', score: 1 },
              { value: '3to6', label: '3-6 months - the standard advice', score: 2 },
              { value: '3', label: '3 months is plenty', score: 3 },
              { value: 'less', label: "Less - I'd rather have money working for me", score: 4 },
            ],
          },
        ],
        contextPrompt: 'How do you feel about debt generally?',
      },
      {
        id: 'time_preference',
        title: 'Present vs Future',
        type: 'slider_questions',
        questions: [
          {
            id: 'present_future',
            label: 'Where do you sit?',
            leftLabel: 'Enjoy life now',
            rightLabel: 'Sacrifice for the future',
          },
          {
            id: 'active_passive',
            label: 'How involved do you want to be?',
            leftLabel: 'Set and forget',
            rightLabel: 'Actively manage everything',
          },
        ],
        contextPrompt: "What's your philosophy on money?",
      },
    ],
  },
  {
    id: 'flowchart',
    title: 'Financial Checklist',
    icon: CheckCircle2,
    description: 'Following the proven path',
    steps: [
      {
        id: 'basics_check',
        title: 'Foundation',
        type: 'checklist',
        items: [
          { id: 'budget_tracked', label: 'I track my income and expenses', help: 'Know where every euro goes' },
          { id: 'essential_bills', label: 'All essential bills are paid', help: 'Rent, utilities, food, transport' },
          { id: 'min_debt_payments', label: 'Making minimum debt payments', help: 'Never missing required payments' },
        ],
        contextPrompt: 'How organised are you with money admin?',
        education: {
          title: 'Why Tracking Matters',
          content: 'You can\'t optimise what you don\'t measure. Most people who start tracking find EUR200-500/month in "leaks".',
          link: 'https://www.ccpc.ie/consumers/money/budgeting/',
        },
      },
      {
        id: 'quick_wins',
        title: 'Quick Wins',
        type: 'checklist',
        items: [
          { id: 'switched_energy', label: 'Switched energy provider in last 12 months', help: 'Save EUR300-500/year' },
          { id: 'switched_insurance', label: 'Shopped around for insurance', help: 'Car, home, health' },
          { id: 'switched_broadband', label: 'Checked broadband/phone deals', help: 'Loyalty rarely pays' },
        ],
        contextPrompt: "Any providers you've been meaning to switch?",
        education: {
          title: 'The Switching Bonus',
          content: 'Irish providers offer huge discounts to new customers. Bonkers.ie makes comparing easy.',
          link: 'https://www.bonkers.ie/',
        },
      },
      {
        id: 'emergency_check',
        title: 'Emergency Fund Status',
        type: 'single_select',
        question: 'Where are you with your emergency fund?',
        options: [
          { value: 'none', label: 'No dedicated emergency fund yet' },
          { value: 'starter', label: 'Have EUR1,000+ or 1 month expenses' },
          { value: 'building', label: 'Have 1-3 months expenses' },
          { value: 'solid', label: 'Have 3-6 months expenses' },
          { value: 'strong', label: 'Have 6+ months expenses' },
        ],
        contextPrompt: 'What would it take for you to feel financially secure?',
      },
      {
        id: 'pension_check',
        title: 'Pension Optimisation',
        type: 'single_select',
        question: 'Pension matching status:',
        options: [
          { value: 'no_scheme', label: 'No employer scheme available' },
          { value: 'not_enrolled', label: 'Scheme available but not enrolled' },
          { value: 'partial', label: 'Enrolled but not getting full match' },
          { value: 'full_match', label: 'Getting full employer match' },
          { value: 'self_employed', label: 'Self-employed / PRSA' },
        ],
        contextPrompt: "What's your pension situation?",
        education: {
          title: "Don't Leave Free Money Behind",
          content: "If your employer offers matching and you're not taking the full match, you're literally turning down free money.",
          link: 'https://www.pensionsauthority.ie/',
        },
      },
      {
        id: 'property_check',
        title: 'Property Goals',
        type: 'single_select',
        question: 'Housing situation:',
        options: [
          { value: 'own_outright', label: 'Own home, no mortgage' },
          { value: 'own_mortgage', label: 'Own home with mortgage' },
          { value: 'saving_deposit', label: 'Renting, saving for deposit' },
          { value: 'renting_happy', label: 'Renting, happy to continue' },
          { value: 'renting_unsure', label: 'Renting, unsure about buying' },
        ],
        contextPrompt: 'What are your thoughts on property?',
      },
    ],
  },
  {
    id: 'generate',
    title: 'Your Plan',
    icon: Sparkles,
    description: 'Personalised roadmap',
    steps: [
      {
        id: 'final_thoughts',
        title: 'Anything Else?',
        type: 'final_context',
        contextPrompt: "Before we generate your plan, is there anything else we should know?",
      },
      {
        id: 'plan_output',
        title: 'Your Financial Roadmap',
        type: 'plan_generation',
      },
    ],
  },
];

function App() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [localFormData, setLocalFormData] = useState<Record<string, unknown>>({});
  const [showEducation, setShowEducation] = useState<Education | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const { formData, updateSection, updateField } = useFormPersistence();
  const { generatePlan, isGenerating, error: llmError, progress } = useLLMGeneration();

  useEffect(() => {
    const savedPlan = storage.loadPlan();
    if (savedPlan) {
      setGeneratedPlan(savedPlan);
    }
    const savedKeys = storage.loadApiKeys();
    if (savedKeys.openai) {
      setApiKey(savedKeys.openai);
    }
  }, []);

  useEffect(() => {
    const flatData: Record<string, unknown> = {};
    Object.entries(formData).forEach(([, data]) => {
      if (typeof data === 'object' && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          flatData[key] = value;
        });
      }
    });
    setLocalFormData(flatData);
  }, [formData]);

  const totalSteps = sections.reduce((acc, section) => acc + section.steps.length, 0);
  const currentGlobalStep = sections.slice(0, currentSection).reduce((acc, section) => acc + section.steps.length, 0) + currentStep;
  const progressPercent = Math.round((currentGlobalStep / (totalSteps - 1)) * 100);

  const currentSectionData = sections[currentSection];
  const currentStepData = currentSectionData?.steps[currentStep];

  const updateLocalFormData = (field: string, value: unknown) => {
    setLocalFormData((prev) => ({ ...prev, [field]: value }));

    const fieldMappings: Record<string, keyof FormData> = {
      age: 'personal', location: 'personal', relationship: 'personal', dependents: 'personal',
      employment_type: 'employment', job_security: 'employment', industry: 'employment',
      gross_salary: 'income', net_monthly: 'income', partner_income: 'income',
      expected_growth: 'income', income_confidence: 'income',
      emergency_fund: 'savings', other_savings: 'savings', monthly_savings: 'savings',
      has_mortgage: 'debt', mortgage_balance: 'debt', mortgage_rate: 'debt',
      other_debt: 'debt', highest_debt_rate: 'debt',
      pension_pot: 'pension', pension_contribution: 'pension',
      employer_match: 'pension', other_investments: 'pension',
      budget_tracked: 'flowchart', essential_bills: 'flowchart', min_debt_payments: 'flowchart',
      switched_energy: 'flowchart', switched_insurance: 'flowchart', switched_broadband: 'flowchart',
      market_drop: 'risk', guaranteed_vs_risk: 'risk', debt_vs_invest: 'risk',
      emergency_fund_size: 'risk', present_future: 'risk', active_passive: 'risk',
    };

    const section = fieldMappings[field];
    if (section) {
      const typeFieldMappings: Record<string, string> = {
        gross_salary: 'grossSalary', net_monthly: 'netMonthly', partner_income: 'partnerIncome',
        expected_growth: 'expectedSalary3Years', income_confidence: 'incomeConfidence',
        emergency_fund: 'emergencyFund', other_savings: 'otherSavings', monthly_savings: 'monthlySavingsCapacity',
        has_mortgage: 'hasMortgage', mortgage_balance: 'mortgageBalance', mortgage_rate: 'mortgageRate',
        other_debt: 'otherDebtTotal', highest_debt_rate: 'highestDebtRate',
        pension_pot: 'pensionPot', pension_contribution: 'monthlyPensionContribution',
        employer_match: 'employerMatch', other_investments: 'otherInvestments',
        employment_type: 'employmentType', job_security: 'jobSecurity',
        budget_tracked: 'budgetTracked', essential_bills: 'essentialBillsPaid', min_debt_payments: 'minDebtPayments',
        switched_energy: 'switchedEnergy', switched_insurance: 'switchedInsurance', switched_broadband: 'switchedBroadband',
        market_drop: 'marketDropReaction', guaranteed_vs_risk: 'guaranteedVsRisk', debt_vs_invest: 'debtVsInvest',
        emergency_fund_size: 'emergencyFundPreference', present_future: 'presentFutureSlider', active_passive: 'activePassiveSlider',
      };
      const mappedField = typeFieldMappings[field] || field;
      updateField(section, mappedField as never, value as never);
    }
  };

  const nextStep = () => {
    if (currentStep < currentSectionData.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      setCurrentStep(0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      setCurrentStep(sections[currentSection - 1].steps.length - 1);
    }
  };

  const jumpToSection = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentStep(0);
    setMobileNavOpen(false);
  };

  const handleGeneratePlan = async (useAI: boolean) => {
    if (useAI && apiKey) {
      try {
        const plan = await generatePlan(formData, { provider: 'openai', apiKey, model: 'gpt-4-turbo-preview' });
        setGeneratedPlan(plan);
        storage.savePlan(plan);
      } catch {
        const plan = generateRuleBasedPlan(formData);
        setGeneratedPlan(plan);
        storage.savePlan(plan);
      }
    } else {
      const plan = generateRuleBasedPlan(formData);
      setGeneratedPlan(plan);
      storage.savePlan(plan);
    }
  };

  const renderField = (field: Field) => {
    if (field.conditional) {
      const [condField, condValue] = field.conditional.split(':');
      if (localFormData[condField] !== condValue) return null;
    }
    return (
      <div key={field.id} className="space-y-2">
        <Label htmlFor={field.id} className="text-slate-700 font-medium">
          {field.label}
          {field.optional && <span className="text-slate-400 font-normal ml-2">(optional)</span>}
        </Label>
        {field.type === 'select' ? (
          <select
            id={field.id}
            value={(localFormData[field.id] as string) || ''}
            onChange={(e) => updateLocalFormData(field.id, e.target.value)}
            className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select...</option>
            {field.options?.map((opt) => (<option key={opt} value={opt}>{opt}</option>))}
          </select>
        ) : (
          <Input
            id={field.id}
            type={field.type}
            placeholder={field.placeholder}
            value={(localFormData[field.id] as string) || ''}
            onChange={(e) => updateLocalFormData(field.id, field.type === 'number' ? Number(e.target.value) : e.target.value)}
            className="h-11 border-slate-200 focus:ring-emerald-500"
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    const step = currentStepData;
    if (!step) return null;

    if (step.type === 'plan_generation') {
      return (
        <div className="space-y-6">
          {!generatedPlan && !isGenerating ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-slate-900 mb-3">Ready to Generate Your Plan</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">We'll analyse your profile and create a personalised financial roadmap.</p>
              <div className="space-y-4">
                <Button onClick={() => handleGeneratePlan(false)} className="w-full max-w-xs bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg">
                  Generate Plan (Rule-Based)
                </Button>
                <div className="flex items-center gap-4 max-w-xs mx-auto">
                  <div className="h-px flex-1 bg-slate-200" /><span className="text-slate-400 text-sm">or</span><div className="h-px flex-1 bg-slate-200" />
                </div>
                <Button onClick={() => setShowApiKeyModal(true)} variant="outline" className="w-full max-w-xs">
                  <Key className="w-4 h-4 mr-2" />Use AI (OpenAI API Key)
                </Button>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-6" />
              <p className="text-slate-600">{progress || 'Generating your plan...'}</p>
              {llmError && <p className="text-red-500 mt-2">{llmError}</p>}
            </div>
          ) : (
            <PlanDisplay plan={generatedPlan!} onRegenerate={() => setGeneratedPlan(null)} />
          )}
        </div>
      );
    }

    if (step.type === 'final_context') {
      return (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">Almost there!</h3>
            <p className="text-slate-600 mt-2">Any final thoughts before we generate your plan?</p>
          </div>
          <Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[150px] border-slate-200 focus:ring-emerald-500" />
        </div>
      );
    }

    if (step.fields) {
      return (
        <div className="space-y-6">
          <div className="grid gap-4">{step.fields.map(renderField)}</div>
          {step.contextPrompt && (
            <div className="pt-4 border-t border-slate-100">
              <Label className="text-slate-700 font-medium mb-2 block">Additional context <span className="text-slate-400 font-normal">(optional)</span></Label>
              <Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200 focus:ring-emerald-500" />
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'goals_input') {
      const selectedGoals = (localFormData.selected_goals as string[]) || [];
      return (
        <div className="space-y-6">
          <p className="text-slate-600">Select all that apply:</p>
          <div className="grid grid-cols-2 gap-3">
            {step.presets?.map((goal) => (
              <button key={goal.id} onClick={() => { const newGoals = selectedGoals.includes(goal.id) ? selectedGoals.filter((g) => g !== goal.id) : [...selectedGoals, goal.id]; updateLocalFormData('selected_goals', newGoals); updateSection('goals', { selectedGoals: newGoals }); }} className={`p-4 rounded-xl border-2 text-left transition-all ${selectedGoals.includes(goal.id) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className="text-2xl mb-2 block">{goal.icon}</span>
                <span className={`font-medium ${selectedGoals.includes(goal.id) ? 'text-emerald-900' : 'text-slate-700'}`}>{goal.label}</span>
              </button>
            ))}
          </div>
          {step.contextPrompt && (
            <div className="pt-4">
              <Label className="text-slate-700 font-medium mb-2 block">Tell us more about your goals</Label>
              <Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200 focus:ring-emerald-500" />
            </div>
          )}
        </div>
      );
    }

    if (step.type === 'multiselect') {
      const selectedValues = (localFormData[`${step.id}_values`] as string[]) || [];
      return (
        <div className="space-y-6">
          <p className="text-lg text-slate-700">{step.question}</p>
          <div className="grid gap-3">
            {step.options?.map((option) => { const Icon = option.icon; return (
              <button key={option.id} onClick={() => { const newValues = selectedValues.includes(option.id!) ? selectedValues.filter((v) => v !== option.id) : [...selectedValues, option.id!]; updateLocalFormData(`${step.id}_values`, newValues); updateSection('goals', { lifestyleValues: newValues }); }} className={`p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${selectedValues.includes(option.id!) ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedValues.includes(option.id!) ? 'bg-emerald-500' : 'bg-slate-100'}`}>{Icon && <Icon className={`w-5 h-5 ${selectedValues.includes(option.id!) ? 'text-white' : 'text-slate-500'}`} />}</div>
                <span className={`font-medium ${selectedValues.includes(option.id!) ? 'text-emerald-900' : 'text-slate-700'}`}>{option.label}</span>
              </button>
            ); })}
          </div>
          {step.contextPrompt && (<div className="pt-4"><Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200" /></div>)}
        </div>
      );
    }

    if (step.type === 'scenario') {
      return (
        <div className="space-y-8">
          {step.scenarios?.map((scenario) => (
            <div key={scenario.id} className="space-y-4">
              <p className="text-lg font-medium text-slate-800">{scenario.question}</p>
              <div className="grid gap-2">
                {scenario.options.map((option) => (
                  <button key={option.value} onClick={() => updateLocalFormData(scenario.id, option.value)} className={`p-4 rounded-xl border-2 text-left transition-all ${localFormData[scenario.id] === option.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <span className={localFormData[scenario.id] === option.value ? 'text-emerald-900' : 'text-slate-700'}>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {step.contextPrompt && (<div className="pt-4 border-t border-slate-100"><Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200" /></div>)}
        </div>
      );
    }

    if (step.type === 'slider_questions') {
      return (
        <div className="space-y-8">
          {step.questions?.map((q) => (
            <div key={q.id} className="space-y-4">
              <p className="text-lg font-medium text-slate-800">{q.label}</p>
              <div className="px-2">
                <Slider value={[(localFormData[q.id] as number) || 50]} onValueChange={(value) => updateLocalFormData(q.id, value[0])} max={100} step={1} className="w-full" />
                <div className="flex justify-between mt-2 text-sm text-slate-500"><span>{q.leftLabel}</span><span>{q.rightLabel}</span></div>
              </div>
            </div>
          ))}
          {step.contextPrompt && (<div className="pt-4 border-t border-slate-100"><Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200" /></div>)}
        </div>
      );
    }

    if (step.type === 'checklist') {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            {step.items?.map((item) => (
              <label key={item.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${localFormData[item.id] ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <input type="checkbox" checked={(localFormData[item.id] as boolean) || false} onChange={(e) => updateLocalFormData(item.id, e.target.checked)} className="mt-1 w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <div><span className={`font-medium ${localFormData[item.id] ? 'text-emerald-900' : 'text-slate-700'}`}>{item.label}</span><p className="text-sm text-slate-500 mt-0.5">{item.help}</p></div>
              </label>
            ))}
          </div>
          {step.contextPrompt && (<div className="pt-4 border-t border-slate-100"><Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200" /></div>)}
        </div>
      );
    }

    if (step.type === 'single_select') {
      return (
        <div className="space-y-6">
          <p className="text-lg text-slate-700">{step.question}</p>
          <div className="grid gap-2">
            {step.options?.map((option) => (
              <button key={option.value} onClick={() => updateLocalFormData(step.id, option.value)} className={`p-4 rounded-xl border-2 text-left transition-all ${localFormData[step.id] === option.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <span className={localFormData[step.id] === option.value ? 'text-emerald-900' : 'text-slate-700'}>{option.label}</span>
              </button>
            ))}
          </div>
          {step.contextPrompt && (<div className="pt-4 border-t border-slate-100"><Textarea placeholder={step.contextPrompt} value={(localFormData[`${step.id}_context`] as string) || ''} onChange={(e) => updateLocalFormData(`${step.id}_context`, e.target.value)} className="min-h-[100px] border-slate-200" /></div>)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-stone-100">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm"><PiggyBank className="w-5 h-5 text-white" /></div>
              <div><h1 className="text-lg font-semibold text-slate-900">Slainte Finance</h1><p className="text-xs text-slate-500">Irish Personal Finance Guide</p></div>
            </div>
            <div className="hidden md:block text-right"><p className="text-sm font-medium text-slate-700">{progressPercent}% complete</p><p className="text-xs text-slate-500">Step {currentGlobalStep + 1} of {totalSteps}</p></div>
            <button className="md:hidden" onClick={() => setMobileNavOpen(true)}><Menu className="w-6 h-6 text-slate-600" /></button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px,1fr] gap-8">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              {sections.map((section, idx) => { const Icon = section.icon; const isActive = idx === currentSection; const isComplete = idx < currentSection; return (
                <button key={section.id} onClick={() => jumpToSection(idx)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isActive ? 'bg-emerald-100 text-emerald-900' : isComplete ? 'bg-white text-slate-700 hover:bg-slate-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-emerald-500 text-white' : isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}</div>
                  <div><p className="font-medium text-sm">{section.title}</p><p className="text-xs opacity-70">{section.steps.length} steps</p></div>
                </button>
              ); })}
            </div>
          </aside>

          <main>
            <div className="mb-6"><Progress value={progressPercent} className="h-2 bg-slate-200" /></div>
            <div className="mb-6">
              <Badge variant="outline" className="mb-2 text-emerald-700 border-emerald-200 bg-emerald-50">{currentSectionData?.title}</Badge>
              <h2 className="text-2xl font-semibold text-slate-900">{currentStepData?.title}</h2>
              {currentSectionData?.description && currentStep === 0 && <p className="text-slate-600 mt-1">{currentSectionData.description}</p>}
            </div>
            <Card className="border-0 shadow-lg"><CardContent className="p-6 md:p-8">{renderStepContent()}</CardContent></Card>
            {currentStepData?.education && (<button onClick={() => setShowEducation(currentStepData.education!)} className="mt-4 flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium"><Lightbulb className="w-4 h-4" />Learn more about this</button>)}
            <div className="flex items-center justify-between mt-8">
              <Button variant="outline" onClick={prevStep} disabled={currentSection === 0 && currentStep === 0} className="gap-2"><ChevronLeft className="w-4 h-4" />Back</Button>
              {!(currentStepData?.type === 'plan_generation' && generatedPlan) && (<Button onClick={nextStep} disabled={currentSection === sections.length - 1 && currentStep === currentSectionData.steps.length - 1} className="gap-2 bg-emerald-600 hover:bg-emerald-700">Continue<ChevronRight className="w-4 h-4" /></Button>)}
            </div>
          </main>
        </div>
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-semibold">Sections</h3><button onClick={() => setMobileNavOpen(false)}><X className="w-6 h-6 text-slate-400" /></button></div>
            <div className="grid grid-cols-3 gap-4">
              {sections.map((section, idx) => { const Icon = section.icon; const isActive = idx === currentSection; const isComplete = idx < currentSection; return (
                <button key={section.id} onClick={() => jumpToSection(idx)} className={`flex flex-col items-center justify-center p-4 rounded-xl transition-colors ${isActive ? 'bg-emerald-100 text-emerald-700' : isComplete ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'}`}><Icon className="w-6 h-6" /><span className="text-xs mt-2">{section.title}</span></button>
              ); })}
            </div>
          </div>
        </div>
      )}

      {showEducation && (
        <Dialog open={!!showEducation} onOpenChange={() => setShowEducation(null)}>
          <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2 text-emerald-900"><Lightbulb className="w-5 h-5" />{showEducation.title}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-slate-700 whitespace-pre-line">{showEducation.content}</p>
              {showEducation.link && (<a href={showEducation.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 text-sm font-medium">Official guidance<ExternalLink className="w-4 h-4" /></a>)}
              <Button onClick={() => setShowEducation(null)} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">Got it</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={showApiKeyModal} onOpenChange={setShowApiKeyModal}>
        <DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="w-5 h-5" />Enter Your OpenAI API Key</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800"><p className="font-medium mb-1">Your key stays private</p><p>API calls go directly from your browser to OpenAI.</p></div>
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input id="apiKey" type={showApiKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="pr-10" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">Get an API key from OpenAI<ExternalLink className="w-3 h-3" /></a>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowApiKeyModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={() => { storage.saveApiKey('openai', apiKey); setShowApiKeyModal(false); handleGeneratePlan(true); }} disabled={!apiKey} className="flex-1 bg-emerald-600 hover:bg-emerald-700">Generate with AI</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanDisplay({ plan, onRegenerate }: { plan: GeneratedPlan; onRegenerate: () => void }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
        <h3 className="text-xl font-semibold text-emerald-900 mb-2">Your Financial Profile</h3>
        <p className="text-emerald-800 mb-4">{plan.summary.riskProfile}</p>
        <div className="grid md:grid-cols-2 gap-4">
          <div><h4 className="font-medium text-emerald-900 mb-2">Strengths</h4><ul className="space-y-1">{plan.summary.keyStrengths.map((s, i) => (<li key={i} className="flex items-start gap-2 text-sm text-emerald-700"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />{s}</li>))}</ul></div>
          <div><h4 className="font-medium text-emerald-900 mb-2">Focus Areas</h4><ul className="space-y-1">{plan.summary.keyAreas.map((a, i) => (<li key={i} className="flex items-start gap-2 text-sm text-emerald-700"><Target className="w-4 h-4 mt-0.5 shrink-0" />{a}</li>))}</ul></div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-amber-500" />Priority Actions</h4>
        <div className="space-y-3">
          {plan.priorityActions.map((action) => (
            <div key={action.id} className={`border-l-4 p-4 rounded-r-lg ${action.urgency === 'critical' ? 'bg-red-50 border-red-400' : action.urgency === 'high' ? 'bg-amber-50 border-amber-400' : action.urgency === 'medium' ? 'bg-blue-50 border-blue-400' : 'bg-slate-50 border-slate-400'}`}>
              <p className="font-medium text-slate-900">{action.title}</p>
              <p className="text-sm text-slate-600 mt-1">{action.description}</p>
              <p className="text-sm text-slate-700 mt-2"><strong>Action:</strong> {action.action}</p>
              <Badge variant="outline" className="mt-2">{action.potentialImpact}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-emerald-600" />Monthly Milestones</h4>
        <div className="grid gap-3">
          {plan.monthlyMilestones.slice(0, 6).map((month, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2"><span className="font-semibold text-slate-900">{month.month}</span><Badge variant="outline" className="text-xs">Month {i + 1}</Badge></div>
              <ul className="space-y-1 text-sm text-slate-600">{month.tasks.map((task) => (<li key={task.id} className="flex items-center gap-2"><Circle className="w-3 h-3 text-slate-400" />{task.task}</li>))}</ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-blue-600" />Yearly Goals</h4>
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
          <div className="grid md:grid-cols-3 gap-6">
            {plan.yearlyGoals.map((yearGoal) => (
              <div key={yearGoal.year}><h5 className="font-medium text-slate-900 mb-3">By End of {yearGoal.year}</h5><ul className="space-y-2 text-sm text-slate-700">{yearGoal.goals.map((goal) => (<li key={goal.id} className="flex items-start gap-2"><Circle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" /><span>{goal.goal} <span className="text-slate-500">({goal.target})</span></span></li>))}</ul></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-100 rounded-lg p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-700 mb-2">Important Disclaimers</p>
        <ul className="list-disc pl-4 space-y-1">{plan.disclaimers.map((d, i) => (<li key={i}>{d}</li>))}</ul>
        <a href="https://www.ccpc.ie/consumers/" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline mt-2 inline-flex items-center gap-1">CCPC Consumer Resources <ExternalLink className="w-3 h-3" /></a>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRegenerate} className="flex-1"><Sparkles className="w-4 h-4 mr-2" />Regenerate Plan</Button>
        <Button variant="outline" onClick={() => { const dataStr = storage.exportData(); const blob = new Blob([dataStr], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `slainte-finance-data-${new Date().toISOString().split('T')[0]}.json`; a.click(); }} className="flex-1"><Download className="w-4 h-4 mr-2" />Export Data</Button>
      </div>
    </div>
  );
}

export default App;
