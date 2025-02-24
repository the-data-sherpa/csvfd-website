import { ApplicationFormData } from '../../pages/ApplicationForm';

interface MedicalHistoryStepProps {
  formData: ApplicationFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: {
    [key: string]: string;
  };
  touched: {
    [key: string]: boolean;
  };
  onBlur: (fieldName: string) => void;
}

export function MedicalHistoryStep({ formData, onChange, errors, touched, onBlur }: MedicalHistoryStepProps) {
  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  const medicalQuestions = [
    {
      id: 'medicalConditions',
      text: 'Do you currently have any medical problems?',
      detailsId: 'medicalDetails'
    },
    {
      id: 'physicalHandicap',
      text: 'Do you have any physical handicap that may affect your ability to perform the jobs in the fire service currently offered at Cool Springs Volunteer Fire Department?',
      detailsId: 'physicalHandicapDetails'
    },
    {
      id: 'allergies',
      text: 'Are you currently allergic to anything that would cause the use of Epinephrine (EPI)?',
      detailsId: 'allergyDetails'
    }
  ];

  const historyQuestions = [
    {
      id: 'servedInMilitary',
      text: 'Have you ever served in the United States Military? (Please bring DD-214 to the Fire station after submitting the application)',
      detailsId: null
    },
    {
      id: 'professionalLicense',
      text: 'Do you have a license, certificate, or other authorization to practice a trade or profession?',
      detailsId: 'licenseDetails'
    },
    {
      id: 'firstAidTraining',
      text: 'Do you have any previous first aid or CPR training?',
      detailsId: 'firstAidDetails'
    },
    {
      id: 'firefightingExperience',
      text: 'Do you have any previous firefighting or EMS experience?',
      detailsId: 'experienceDetails'
    },
    {
      id: 'trafficViolations',
      text: 'Have you ever received any traffic violations?',
      detailsId: 'trafficViolationsDetails'
    }
  ];

  const renderQuestionWithDetails = (question: { id: string; text: string; detailsId: string | null }) => (
    <div key={question.id} className="space-y-3">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={question.id}
            name={question.id}
            checked={formData[question.id as keyof ApplicationFormData] as boolean}
            onChange={onChange}
            onBlur={() => onBlur(question.id)}
            className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3">
          <label htmlFor={question.id} className="text-sm font-medium text-gray-700">
            {question.text}
          </label>
          {showError(question.id)}
        </div>
      </div>
      {question.detailsId && formData[question.id as keyof ApplicationFormData] && (
        <div className="ml-7">
          <textarea
            id={question.detailsId}
            name={question.detailsId}
            value={formData[question.detailsId as keyof ApplicationFormData] as string}
            onChange={onChange}
            onBlur={() => onBlur(question.detailsId)}
            rows={3}
            placeholder="Please provide details..."
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched[question.detailsId] && errors[question.detailsId] ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError(question.detailsId)}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Medical History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
        <div className="space-y-4">
          {medicalQuestions.map(renderQuestionWithDetails)}
        </div>
      </div>

      {/* Personal History */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal History</h3>
        <div className="space-y-4">
          {historyQuestions.map(renderQuestionWithDetails)}
        </div>
      </div>
    </div>
  );
} 