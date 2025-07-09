'use client';

import { Question, QuestionType, SurveySchema } from '@/lib/types';
import { useSurveyStore } from '@/lib/store';
import { LikertScale } from './likert-scale';
import { TextInput } from './text-input';
import { MultipleChoice } from './multiple-choice';
import { NumberInput } from './number-input';
import { BooleanInput } from './boolean-input';

interface QuestionRendererProps {
  question: Question;
  survey: SurveySchema;
}

export function QuestionRenderer({ question, survey }: QuestionRendererProps) {
  const { responses, saveResponse } = useSurveyStore();
  const value = responses[question.id];
  
  const handleChange = (newValue: any) => {
    saveResponse(question.id, newValue);
  };

  const primaryColor = survey.settings.customStyling?.primaryColor || '#2563eb';

  switch (question.type) {
    case QuestionType.LIKERT_5:
    case QuestionType.LIKERT_3:
      return (
        <LikertScale
          options={question.options || []}
          value={value}
          onChange={handleChange}
          primaryColor={primaryColor}
        />
      );

    case QuestionType.MULTIPLE_CHOICE:
      return (
        <MultipleChoice
          options={question.options || []}
          value={value}
          onChange={handleChange}
          multiple={true}
          primaryColor={primaryColor}
        />
      );

    case QuestionType.SINGLE_SELECT:
      return (
        <MultipleChoice
          options={question.options || []}
          value={value}
          onChange={handleChange}
          multiple={false}
          primaryColor={primaryColor}
        />
      );

    case QuestionType.TEXT:
      return (
        <TextInput
          value={value}
          onChange={handleChange}
          validation={question.validation}
          primaryColor={primaryColor}
        />
      );

    case QuestionType.NUMBER:
      return (
        <NumberInput
          value={value}
          onChange={handleChange}
          validation={question.validation}
          primaryColor={primaryColor}
        />
      );

    case QuestionType.BOOLEAN:
      return (
        <BooleanInput
          value={value}
          onChange={handleChange}
          primaryColor={primaryColor}
        />
      );

    default:
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-600">Unsupported question type: {question.type}</p>
        </div>
      );
  }
}