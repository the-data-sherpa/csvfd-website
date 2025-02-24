import { ApplicationFormData } from '../../pages/ApplicationForm';

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
}

export function ReferencesStep({ formData, onChange, errors, touched, onBlur }: ReferencesStepProps) {
  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  const handleReferenceChange = (index: number, field: string, value: string) => {
    const newReferences = [...formData.references];
    newReferences[index] = {
      ...newReferences[index],
      [field]: value
    };

    // Create a synthetic event with the correct type
    const syntheticEvent = {
      target: {
        name: 'references',
        value: newReferences,
        type: 'text',
        checked: false,
        id: `reference-${index}-${field}`,
        getAttribute: () => null
      },
      currentTarget: null,
      nativeEvent: null,
      preventDefault: () => {},
      stopPropagation: () => {},
      isPropagationStopped: () => false,
      isDefaultPrevented: () => false,
      persist: () => {},
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      timeStamp: Date.now(),
      type: 'change'
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-medium text-gray-900">References</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please provide three references (not relatives) who have known you for at least 3 years
      </p>

      {formData.references.map((reference, index) => (
        <div key={index} className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900">Reference {index + 1}</h4>
          
          <div>
            <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              type="text"
              id={`name-${index}`}
              value={reference.name}
              onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
              onBlur={() => onBlur(`references.${index}.name`)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched[`references.${index}.name`] && errors[`references.${index}.name`] 
                  ? 'border-red-300' 
                  : 'border-gray-300'}`}
            />
            {showError(`references.${index}.name`)}
          </div>

          <div>
            <label htmlFor={`address-${index}`} className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <input
              type="text"
              id={`address-${index}`}
              value={reference.address}
              onChange={(e) => handleReferenceChange(index, 'address', e.target.value)}
              onBlur={() => onBlur(`references.${index}.address`)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched[`references.${index}.address`] && errors[`references.${index}.address`] 
                  ? 'border-red-300' 
                  : 'border-gray-300'}`}
            />
            {showError(`references.${index}.address`)}
          </div>

          <div>
            <label htmlFor={`phone-${index}`} className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              type="tel"
              id={`phone-${index}`}
              value={reference.phone}
              onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
              onBlur={() => onBlur(`references.${index}.phone`)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched[`references.${index}.phone`] && errors[`references.${index}.phone`] 
                  ? 'border-red-300' 
                  : 'border-gray-300'}`}
            />
            {showError(`references.${index}.phone`)}
          </div>

          <div>
            <label htmlFor={`relationship-${index}`} className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <input
              type="text"
              id={`relationship-${index}`}
              value={reference.relationship}
              onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
              onBlur={() => onBlur(`references.${index}.relationship`)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
                ${touched[`references.${index}.relationship`] && errors[`references.${index}.relationship`] 
                  ? 'border-red-300' 
                  : 'border-gray-300'}`}
            />
            {showError(`references.${index}.relationship`)}
          </div>
        </div>
      ))}
    </div>
  );
} 