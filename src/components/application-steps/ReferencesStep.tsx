import { ApplicationFormData } from '../../pages/ApplicationForm';
import { Loading, Skeleton } from '../ui/Loading';
import { useState } from 'react';

interface ReferencesStepProps {
  formData: ApplicationFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  errors: {
    [key: string]: string;
  };
  touched: {
    [key: string]: boolean;
  };
  onBlur: (fieldName: string) => void;
  loading?: boolean;
}

export function ReferencesStep({ formData, onChange, errors, touched, onBlur, loading = false }: ReferencesStepProps) {
  const [validating, setValidating] = useState<string | null>(null);

  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-6">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleReferenceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange(e);
    
    if (value.trim()) {
      setValidating(name);
      try {
        // Simulate validation delay
        await new Promise(resolve => setTimeout(resolve, 500));
      } finally {
        setValidating(null);
      }
    }
  };

  const renderReferenceFields = (index: number) => {
    const prefix = `references.${index}`;
    return (
      <div key={index} className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Reference {index + 1}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${prefix}.name`} className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="relative">
              <input
                type="text"
                id={`${prefix}.name`}
                name={`${prefix}.name`}
                value={formData.references[index].name}
                onChange={handleReferenceChange}
                onBlur={() => onBlur(`${prefix}.name`)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                  ${touched[`${prefix}.name`] && errors[`${prefix}.name`] ? 'border-red-300' : 'border-gray-300'}`}
              />
              {validating === `${prefix}.name` && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loading type="spinner" className="h-4 w-4" />
                </div>
              )}
            </div>
            {showError(`${prefix}.name`)}
          </div>

          <div>
            <label htmlFor={`${prefix}.relationship`} className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <div className="relative">
              <input
                type="text"
                id={`${prefix}.relationship`}
                name={`${prefix}.relationship`}
                value={formData.references[index].relationship}
                onChange={handleReferenceChange}
                onBlur={() => onBlur(`${prefix}.relationship`)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                  ${touched[`${prefix}.relationship`] && errors[`${prefix}.relationship`] ? 'border-red-300' : 'border-gray-300'}`}
              />
              {validating === `${prefix}.relationship` && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loading type="spinner" className="h-4 w-4" />
                </div>
              )}
            </div>
            {showError(`${prefix}.relationship`)}
          </div>

          <div>
            <label htmlFor={`${prefix}.address`} className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <div className="relative">
              <input
                type="text"
                id={`${prefix}.address`}
                name={`${prefix}.address`}
                value={formData.references[index].address}
                onChange={handleReferenceChange}
                onBlur={() => onBlur(`${prefix}.address`)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                  ${touched[`${prefix}.address`] && errors[`${prefix}.address`] ? 'border-red-300' : 'border-gray-300'}`}
              />
              {validating === `${prefix}.address` && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loading type="spinner" className="h-4 w-4" />
                </div>
              )}
            </div>
            {showError(`${prefix}.address`)}
          </div>

          <div>
            <label htmlFor={`${prefix}.phone`} className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <div className="relative">
              <input
                type="tel"
                id={`${prefix}.phone`}
                name={`${prefix}.phone`}
                value={formData.references[index].phone}
                onChange={handleReferenceChange}
                onBlur={() => onBlur(`${prefix}.phone`)}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                  ${touched[`${prefix}.phone`] && errors[`${prefix}.phone`] ? 'border-red-300' : 'border-gray-300'}`}
              />
              {validating === `${prefix}.phone` && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loading type="spinner" className="h-4 w-4" />
                </div>
              )}
            </div>
            {showError(`${prefix}.phone`)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {[0, 1, 2].map(renderReferenceFields)}
    </div>
  );
} 