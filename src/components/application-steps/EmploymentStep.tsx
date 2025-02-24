import { ApplicationFormData } from '../../pages/ApplicationForm';

interface EmploymentStepProps {
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

export function EmploymentStep({ formData, onChange, errors, touched, onBlur }: EmploymentStepProps) {
  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <div className="space-y-6">
      {/* Current Employment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current Employment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="currentEmployer" className="block text-sm font-medium text-gray-700">
              Employer
            </label>
            <input
              type="text"
              id="currentEmployer"
              name="currentEmployer"
              value={formData.currentEmployer}
              onChange={onChange}
              onBlur={() => onBlur('currentEmployer')}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched.currentEmployer && errors.currentEmployer ? 'border-red-300' : 'border-gray-300'}`}
              required
            />
            {showError('currentEmployer')}
          </div>
          <div>
            <label htmlFor="employerCity" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="employerCity"
              name="employerCity"
              value={formData.employerCity}
              onChange={onChange}
              onBlur={() => onBlur('employerCity')}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched.employerCity && errors.employerCity ? 'border-red-300' : 'border-gray-300'}`}
              required
            />
            {showError('employerCity')}
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <input
            type="text"
            id="position"
            name="position"
            value={formData.position}
            onChange={onChange}
            onBlur={() => onBlur('position')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.position && errors.position ? 'border-red-300' : 'border-gray-300'}`}
            required
          />
          {showError('position')}
        </div>
      </div>

      {/* Previous Employment */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Employment</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="previousEmployer" className="block text-sm font-medium text-gray-700">
              Previous Employer
            </label>
            <input
              type="text"
              id="previousEmployer"
              name="previousEmployer"
              value={formData.previousEmployer}
              onChange={onChange}
              onBlur={() => onBlur('previousEmployer')}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched.previousEmployer && errors.previousEmployer ? 'border-red-300' : 'border-gray-300'}`}
            />
            {showError('previousEmployer')}
          </div>
          <div>
            <label htmlFor="previousEmployerCity" className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              id="previousEmployerCity"
              name="previousEmployerCity"
              value={formData.previousEmployerCity}
              onChange={onChange}
              onBlur={() => onBlur('previousEmployerCity')}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched.previousEmployerCity && errors.previousEmployerCity ? 'border-red-300' : 'border-gray-300'}`}
            />
            {showError('previousEmployerCity')}
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="previousPosition" className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <input
            type="text"
            id="previousPosition"
            name="previousPosition"
            value={formData.previousPosition}
            onChange={onChange}
            onBlur={() => onBlur('previousPosition')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.previousPosition && errors.previousPosition ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('previousPosition')}
        </div>
      </div>
    </div>
  );
} 