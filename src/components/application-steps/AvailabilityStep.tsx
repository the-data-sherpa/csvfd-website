import { ApplicationFormData } from '../../pages/ApplicationForm';

interface AvailabilityStepProps {
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

export function AvailabilityStep({ formData, onChange, errors, touched, onBlur }: AvailabilityStepProps) {
  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  const questions = [
    {
      id: 'availableEmergencyDay',
      text: 'Are you available for emergency calls during the day?'
    },
    {
      id: 'availableEmergencyEvening',
      text: 'Are you available for emergency calls during the evening?'
    },
    {
      id: 'availableTraining',
      text: 'Are you willing to attend training classes and drills? (Minimum 36 hours per year)'
    },
    {
      id: 'availablePublicEvents',
      text: 'Are you willing to participate in public relation events?'
    },
    {
      id: 'agreeToRules',
      text: 'Will you abide by the By-laws and Rules of The Cool Springs Volunteer Fire Department?'
    },
    {
      id: 'upholdDepartment',
      text: 'Will you uphold The Cool Springs Volunteer Fire Department and its members in the highest esteem and respect?'
    },
    {
      id: 'maintainEquipment',
      text: 'Will you take care of all department issued equipment, and report any problems as soon as you can?'
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Availability & Commitment</h3>
      <div className="space-y-4">
        {questions.map(({ id, text }) => (
          <div key={id} className="flex items-start">
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                id={id}
                name={id}
                checked={formData[id as keyof ApplicationFormData] as boolean}
                onChange={onChange}
                onBlur={() => onBlur(id)}
                className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3">
              <label htmlFor={id} className="text-sm font-medium text-gray-700">
                {text}
              </label>
              {showError(id)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 