import { useState, useCallback } from 'react';
import type { FormData } from '../types/form';
import type { GeneratedPlan } from '../types/plan';
import type { ApiConfig } from '../types/api';
import { buildPlanPrompt } from '../prompts/planGenerationPrompt';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt';

interface UseLLMGenerationReturn {
  generatePlan: (formData: FormData, config: ApiConfig) => Promise<GeneratedPlan>;
  isGenerating: boolean;
  error: string | null;
  progress: string;
}

export function useLLMGeneration(): UseLLMGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  const generateWithOpenAI = async (
    formData: FormData,
    apiKey: string,
    model: string
  ): Promise<GeneratedPlan> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPlanPrompt(formData) },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as GeneratedPlan;
  };

  const generateWithAnthropic = async (
    _formData: FormData,
    _apiKey: string,
    _model: string
  ): Promise<GeneratedPlan> => {
    // Anthropic doesn't support direct browser calls due to CORS
    throw new Error(
      'Anthropic API does not support direct browser calls. Please use an OpenAI API key, or self-host with a proxy.'
    );
  };

  const generatePlan = useCallback(async (
    formData: FormData,
    config: ApiConfig
  ): Promise<GeneratedPlan> => {
    setIsGenerating(true);
    setError(null);
    setProgress('Analysing your financial profile...');

    try {
      let plan: GeneratedPlan;

      if (config.provider === 'openai') {
        setProgress('Generating personalised plan with GPT-4...');
        plan = await generateWithOpenAI(formData, config.apiKey, config.model);
      } else {
        setProgress('Generating personalised plan with Claude...');
        plan = await generateWithAnthropic(formData, config.apiKey, config.model);
      }

      // Add generation timestamp
      plan.generatedAt = new Date().toISOString();

      setProgress('Plan generated successfully!');
      return plan;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate plan';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generatePlan, isGenerating, error, progress };
}
