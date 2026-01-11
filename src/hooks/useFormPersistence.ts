import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { FormData } from '../types/form';
import { initialFormData } from '../types/form';

export function useFormPersistence() {
  const [formData, setFormData, clearFormData] = useLocalStorage<FormData>(
    'slainte_form_data',
    initialFormData
  );

  // Update a specific section
  const updateSection = useCallback(
    <K extends keyof FormData>(section: K, sectionData: Partial<FormData[K]>) => {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          ...sectionData,
        },
      }));
    },
    [setFormData]
  );

  // Update a specific field
  const updateField = useCallback(
    <K extends keyof FormData, F extends keyof FormData[K]>(
      section: K,
      field: F,
      value: FormData[K][F]
    ) => {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...(prev[section] as object),
          [field]: value,
        },
      }));
    },
    [setFormData]
  );

  // Reset to initial state
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, [setFormData]);

  // Calculate completion percentage
  const getCompletionPercentage = useCallback(() => {
    const sections = Object.keys(formData) as (keyof FormData)[];
    let totalFields = 0;
    let filledFields = 0;

    sections.forEach((section) => {
      const sectionData = formData[section];
      if (typeof sectionData === 'object' && sectionData !== null) {
        Object.entries(sectionData).forEach(([_, value]) => {
          totalFields++;
          if (
            value !== null &&
            value !== '' &&
            !(Array.isArray(value) && value.length === 0)
          ) {
            filledFields++;
          }
        });
      } else if (sectionData) {
        totalFields++;
        filledFields++;
      }
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  }, [formData]);

  return {
    formData,
    setFormData,
    updateSection,
    updateField,
    resetForm,
    clearFormData,
    getCompletionPercentage,
  };
}
