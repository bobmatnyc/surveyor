import { SurveySchema, Question, QuestionType } from './types';

export interface SurveyJSSchema {
  title: string;
  description?: string;
  pages: SurveyJSPage[];
  showProgressBar?: string;
  progressBarType?: string;
  showNavigationButtons?: string;
  showQuestionNumbers?: string;
  questionTitleLocation?: string;
  questionErrorLocation?: string;
  focusFirstQuestionAutomatic?: boolean;
  checkErrorsMode?: string;
  showCompletedPage?: boolean;
  completeText?: string;
  completedHtml?: string;
  loadingHtml?: string;
  requiredText?: string;
  questionTitleTemplate?: string;
  triggers?: any[];
  calculatedValues?: any[];
  surveyPostId?: string;
  surveyShowDataSaving?: boolean;
  cookieName?: string;
  sendResultOnPageNext?: boolean;
  storeOthersAsComment?: boolean;
  maxTextLength?: number;
  maxOthersLength?: number;
  goNextPageAutomatic?: boolean;
  clearInvisibleValues?: string;
  textUpdateMode?: string;
  startSurveyText?: string;
  pagePrevText?: string;
  pageNextText?: string;
  questionTitlePattern?: string;
  questionStartIndex?: string;
  questionDescriptionLocation?: string;
  showTOC?: boolean;
  tocLocation?: string;
  showBrandInfo?: boolean;
}

export interface SurveyJSPage {
  name: string;
  title?: string;
  description?: string;
  elements: SurveyJSElement[];
  visible?: boolean;
  visibleIf?: string;
  enableIf?: string;
  readOnly?: boolean;
  questionTitleLocation?: string;
  maxTimeToFinish?: number;
  timeSpent?: number;
  navigationButtonsVisibility?: string;
  navigationTitle?: string;
  navigationDescription?: string;
}

export interface SurveyJSElement {
  type: string;
  name: string;
  title?: string;
  description?: string;
  isRequired?: boolean;
  visible?: boolean;
  visibleIf?: string;
  enableIf?: string;
  readOnly?: boolean;
  requiredIf?: string;
  defaultValue?: any;
  correctAnswer?: any;
  clearIfInvisible?: string;
  startWithNewLine?: boolean;
  indent?: number;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  renderAs?: string;
  titleLocation?: string;
  descriptionLocation?: string;
  requiredErrorText?: string;
  commentText?: string;
  valueName?: string;
  enabledIf?: string;
  validators?: any[];
  bindings?: any;
  // Question-specific properties
  choices?: SurveyJSChoice[];
  choicesOrder?: string;
  choicesByUrl?: any;
  hasOther?: boolean;
  otherText?: string;
  otherErrorText?: string;
  storeOthersAsComment?: boolean;
  colCount?: number;
  choicesFromQuestion?: string;
  choicesFromQuestionMode?: string;
  hideIfChoicesEmpty?: boolean;
  separateSpecialChoices?: boolean;
  showClearButton?: boolean;
  showSelectAllItem?: boolean;
  showNoneItem?: boolean;
  noneText?: string;
  selectAllText?: string;
  // Likert scale properties
  columns?: SurveyJSMatrixColumn[];
  rows?: SurveyJSMatrixRow[];
  cells?: any;
  cellType?: string;
  columnColCount?: number;
  columnMinWidth?: string;
  rowTitleWidth?: string;
  showHeader?: boolean;
  verticalAlign?: string;
  alternateRows?: boolean;
  isAllRowRequired?: boolean;
  eachRowUnique?: boolean;
  // Text input properties
  inputType?: string;
  size?: number;
  maxLength?: number;
  placeHolder?: string;
  autoComplete?: string;
  // Number input properties
  min?: number;
  max?: number;
  step?: number;
  // Boolean properties
  booleanText?: string;
  booleanFalseText?: string;
  booleanTrueText?: string;
  showTitle?: boolean;
  valueTrue?: any;
  valueFalse?: any;
}

export interface SurveyJSChoice {
  value: any;
  text?: string;
  customValue?: any;
  imageLink?: string;
  visibleIf?: string;
  enableIf?: string;
}

export interface SurveyJSMatrixColumn {
  value: any;
  text?: string;
  customValue?: any;
  imageLink?: string;
  visibleIf?: string;
  enableIf?: string;
}

export interface SurveyJSMatrixRow {
  value: any;
  text?: string;
  customValue?: any;
  imageLink?: string;
  visibleIf?: string;
  enableIf?: string;
}

export class SurveyJSConverter {
  static convertSchema(schema: SurveySchema, stakeholder: string, expertise: string[]): SurveyJSSchema {
    // Filter questions based on stakeholder and expertise
    const filteredQuestions = schema.questions.filter(q => {
      const stakeholderMatch = q.targetStakeholders.includes(stakeholder);
      const expertiseMatch = !q.targetExpertise || 
        q.targetExpertise.some(exp => expertise.includes(exp));
      return stakeholderMatch && expertiseMatch;
    });

    // Group questions by domain for better organization
    const questionsByDomain = filteredQuestions.reduce((acc, question) => {
      if (!acc[question.domain]) {
        acc[question.domain] = [];
      }
      acc[question.domain].push(question);
      return acc;
    }, {} as Record<string, Question[]>);

    // Create pages for each domain
    const pages: SurveyJSPage[] = Object.entries(questionsByDomain).map(([domainId, questions]) => {
      const domain = schema.domains.find(d => d.id === domainId);
      return {
        name: domainId,
        title: domain?.name || domainId,
        description: domain?.description,
        elements: questions.map(q => this.convertQuestion(q, schema))
      };
    });

    return {
      title: schema.name,
      description: schema.description,
      pages,
      showProgressBar: schema.settings.showProgressBar ? 'top' : 'off',
      progressBarType: 'questions',
      showNavigationButtons: schema.settings.allowNavigation ? 'both' : 'none',
      showQuestionNumbers: 'on',
      questionTitleLocation: 'top',
      questionErrorLocation: 'bottom',
      focusFirstQuestionAutomatic: true,
      checkErrorsMode: 'onNextPage',
      showCompletedPage: true,
      completeText: 'Complete Survey',
      completedHtml: '<div class="sv-completedpage"><h3>Thank you for completing the survey!</h3><p>Your responses have been saved successfully.</p></div>',
      requiredText: '*',
      questionTitleTemplate: '{title} {require}',
      clearInvisibleValues: 'onComplete',
      textUpdateMode: 'onBlur',
      startSurveyText: 'Start Survey',
      pagePrevText: 'Previous',
      pageNextText: 'Next',
      questionStartIndex: '1',
      questionDescriptionLocation: 'underTitle',
      showBrandInfo: false
    };
  }

  private static convertQuestion(question: Question, schema: SurveySchema): SurveyJSElement {
    const baseElement: Partial<SurveyJSElement> = {
      name: question.id,
      title: question.text,
      description: question.description,
      isRequired: question.required,
      titleLocation: 'top',
      descriptionLocation: 'underTitle'
    };

    // Add conditional logic if present
    if (question.conditional) {
      baseElement.visibleIf = this.convertConditionalLogic(question.conditional);
    }

    // Add validation if present
    if (question.validation) {
      baseElement.validators = this.convertValidation(question.validation);
    }

    switch (question.type) {
      case QuestionType.LIKERT_5:
        return {
          ...baseElement,
          type: 'radiogroup',
          choices: question.options?.map(option => ({
            value: option.value,
            text: option.label
          })) || [
            { value: 1, text: 'Strongly Disagree' },
            { value: 2, text: 'Disagree' },
            { value: 3, text: 'Neutral' },
            { value: 4, text: 'Agree' },
            { value: 5, text: 'Strongly Agree' }
          ],
          choicesOrder: 'none',
          colCount: 1,
          showClearButton: false
        } as SurveyJSElement;

      case QuestionType.LIKERT_3:
        return {
          ...baseElement,
          type: 'radiogroup',
          choices: question.options?.map(option => ({
            value: option.value,
            text: option.label
          })) || [
            { value: 1, text: 'Disagree' },
            { value: 2, text: 'Neutral' },
            { value: 3, text: 'Agree' }
          ],
          choicesOrder: 'none',
          colCount: 1,
          showClearButton: false
        } as SurveyJSElement;

      case QuestionType.MULTIPLE_CHOICE:
        return {
          ...baseElement,
          type: 'checkbox',
          choices: question.options?.map(option => ({
            value: option.value,
            text: option.label
          })) || [],
          choicesOrder: 'none',
          colCount: 1,
          showSelectAllItem: false,
          showNoneItem: false,
          separateSpecialChoices: true
        } as SurveyJSElement;

      case QuestionType.SINGLE_SELECT:
        return {
          ...baseElement,
          type: 'radiogroup',
          choices: question.options?.map(option => ({
            value: option.value,
            text: option.label
          })) || [],
          choicesOrder: 'none',
          colCount: 1,
          showClearButton: false
        } as SurveyJSElement;

      case QuestionType.TEXT:
        return {
          ...baseElement,
          type: 'text',
          inputType: 'text',
          maxLength: question.validation?.maxLength || 1000,
          placeHolder: 'Enter your response...',
          autoComplete: 'off'
        } as SurveyJSElement;

      case QuestionType.NUMBER:
        return {
          ...baseElement,
          type: 'text',
          inputType: 'number',
          min: 0,
          max: 9999,
          step: 1,
          placeHolder: 'Enter a number...'
        } as SurveyJSElement;

      case QuestionType.BOOLEAN:
        return {
          ...baseElement,
          type: 'boolean',
          booleanText: question.text,
          booleanTrueText: 'Yes',
          booleanFalseText: 'No',
          showTitle: true,
          valueTrue: true,
          valueFalse: false
        } as SurveyJSElement;

      default:
        return {
          ...baseElement,
          type: 'text',
          inputType: 'text',
          placeHolder: 'Enter your response...'
        } as SurveyJSElement;
    }
  }

  private static convertConditionalLogic(conditional: any): string {
    const { dependsOn, condition, value } = conditional;
    
    switch (condition) {
      case 'equals':
        return `{${dependsOn}} = '${value}'`;
      case 'not_equals':
        return `{${dependsOn}} != '${value}'`;
      case 'greater_than':
        return `{${dependsOn}} > ${value}`;
      case 'less_than':
        return `{${dependsOn}} < ${value}`;
      default:
        return `{${dependsOn}} = '${value}'`;
    }
  }

  private static convertValidation(validation: any): any[] {
    const validators = [];

    if (validation.required) {
      validators.push({
        type: 'expression',
        expression: '{item} notempty',
        text: 'This field is required'
      });
    }

    if (validation.minLength) {
      validators.push({
        type: 'text',
        minLength: validation.minLength,
        text: `Minimum length is ${validation.minLength} characters`
      });
    }

    if (validation.maxLength) {
      validators.push({
        type: 'text',
        maxLength: validation.maxLength,
        text: `Maximum length is ${validation.maxLength} characters`
      });
    }

    if (validation.pattern) {
      validators.push({
        type: 'regex',
        regex: validation.pattern,
        text: 'Please enter a valid format'
      });
    }

    return validators;
  }
}