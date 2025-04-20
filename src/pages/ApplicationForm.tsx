import { useState } from 'react';
import { PersonalInformationStep } from '../components/application-steps/PersonalInformationStep';
import { EmploymentStep } from '../components/application-steps/EmploymentStep';
import { MedicalHistoryStep } from '../components/application-steps/MedicalHistoryStep';
import { AvailabilityStep } from '../components/application-steps/AvailabilityStep';
import { ReferencesStep } from '../components/application-steps/ReferencesStep';
import { ReviewStep, openPrintView, PrintLayout } from '../components/application-steps/ReviewStep';
import { Loading, Skeleton } from '../components/ui/Loading';

export interface ApplicationFormData {
  // Fire Department use only section
  memberReceived?: string;
  unitNumber?: string;
  dateReceived?: string;

  // Personal Information
  lastName: string;
  middleName: string;
  firstName: string;
  dob: string;
  currentAddress: string;
  city: string;
  zip: string;
  yearsAtCurrentAddress: string;
  previousAddress: string;
  cellPhone: string;
  homePhone: string;
  socialSecurity: string;
  driversLicenseNumber: string;
  stateAddress: string;
  gender: string;
  birthPlace: string;
  citizenship: string;
  education: string;
  maritalStatus: string;
  spouseName?: string;
  dependents?: string;

  // Employment
  currentEmployer: string;
  employerCity: string;
  position: string;
  previousEmployer: string;
  previousEmployerCity: string;
  previousPosition: string;

  // Medical History
  medicalConditions: boolean;
  medicalDetails?: string;
  physicalHandicap: boolean;
  physicalHandicapDetails?: string;
  allergies: boolean;
  allergyDetails?: string;

  // Personal History
  servedInMilitary: boolean;
  militaryDetails?: string;
  professionalLicense: boolean;
  licenseDetails?: string;
  firstAidTraining: boolean;
  firstAidDetails?: string;
  firefightingExperience: boolean;
  experienceDetails?: string;
  trafficViolations: boolean;
  trafficViolationsDetails?: string;

  // Availability Questions
  availableEmergencyDay: boolean;
  availableEmergencyEvening: boolean;
  availableTraining: boolean;
  availablePublicEvents: boolean;
  willingToBuyUniform: boolean;
  agreeToRules: boolean;
  upholdDepartment: boolean;
  maintainEquipment: boolean;

  // References (3)
  references: Array<{
    name: string;
    address: string;
    phone: string;
    relationship: string;
  }>;

  // Acknowledgments
  acknowledgeDisqualification: boolean;
  acknowledgeVerification: boolean;
  acknowledgeBackgroundCheck: boolean;
}

// Update the validation function to check all required fields
const validatePersonalInfo = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  // Required fields for personal information
  const requiredFields: (keyof ApplicationFormData)[] = [
    'lastName',
    'firstName',
    'dob',
    'currentAddress',
    'city',
    'stateAddress',
    'zip',
    'yearsAtCurrentAddress',
    'cellPhone',
    'socialSecurity',
    'driversLicenseNumber',
    'gender',
    'birthPlace',
    'citizenship',
    'education',
    'maritalStatus'
  ];

  requiredFields.forEach((field) => {
    if (!values[field]?.toString().trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }
  });

  // Validate SSN format
  if (values.socialSecurity && !values.socialSecurity.match(/^\d{3}-?\d{2}-?\d{4}$/)) {
    errors.socialSecurity = 'Please enter a valid SSN (XXX-XX-XXXX)';
  }

  // Validate phone number format
  if (values.cellPhone && !values.cellPhone.match(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/)) {
    errors.cellPhone = 'Please enter a valid phone number';
  }

  // Validate age (must be at least 18)
  if (values.dob) {
    const age = new Date().getFullYear() - new Date(values.dob).getFullYear();
    if (age < 18) {
      errors.dob = 'Must be at least 18 years old';
    }
  }

  // Validate ZIP code format
  if (values.zip && !values.zip.match(/^\d{5}(-\d{4})?$/)) {
    errors.zip = 'Please enter a valid ZIP code';
  }

  return errors;
};

// Add after validatePersonalInfo
const validateEmployment = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  // Required current employment fields
  const requiredFields = [
    'currentEmployer',
    'employerCity',
    'position'
  ] as const;

  requiredFields.forEach((field) => {
    if (!values[field]?.toString().trim()) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
    }
  });

  // If previous employer is provided, require related fields
  if (values.previousEmployer?.trim()) {
    if (!values.previousEmployerCity?.trim()) {
      errors.previousEmployerCity = 'Previous employer city is required when previous employer is provided';
    }
    if (!values.previousPosition?.trim()) {
      errors.previousPosition = 'Previous position is required when previous employer is provided';
    }
  }

  return errors;
};

// Add validation function for medical history
const validateMedicalHistory = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  if (values.medicalConditions && !values.medicalDetails?.trim()) {
    errors.medicalDetails = 'Please provide details about your medical conditions';
  }

  if (values.physicalHandicap && !values.physicalHandicapDetails?.trim()) {
    errors.physicalHandicapDetails = 'Please provide details about your physical handicap';
  }

  if (values.allergies && !values.allergyDetails?.trim()) {
    errors.allergyDetails = 'Please provide details about your allergies';
  }

  if (values.servedInMilitary && !values.militaryDetails?.trim()) {
    errors.militaryDetails = 'Please provide details about your military service';
  }

  if (values.professionalLicense && !values.licenseDetails?.trim()) {
    errors.licenseDetails = 'Please provide details about your professional license';
  }

  if (values.firstAidTraining && !values.firstAidDetails?.trim()) {
    errors.firstAidDetails = 'Please provide details about your first aid training';
  }

  if (values.firefightingExperience && !values.experienceDetails?.trim()) {
    errors.experienceDetails = 'Please provide details about your firefighting experience';
  }

  if (values.trafficViolations && !values.trafficViolationsDetails?.trim()) {
    errors.trafficViolationsDetails = 'Please provide details about your traffic violations';
  }

  return errors;
};

// Add validation function for availability
const validateAvailability = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  if (!values.availableTraining) {
    errors.availableTraining = 'You must be willing to attend training';
  }
  
  if (!values.agreeToRules) {
    errors.agreeToRules = 'You must agree to department rules and regulations';
  }

  return errors;
};

// Add validation function for references
const validateReferences = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
  
  values.references?.forEach((reference, index) => {
    if (!reference.name?.trim()) {
      errors[`references.${index}.name`] = 'Name is required';
    }
    if (!reference.address?.trim()) {
      errors[`references.${index}.address`] = 'Address is required';
    }
    if (!reference.phone?.trim()) {
      errors[`references.${index}.phone`] = 'Phone number is required';
    } else if (!phoneRegex.test(reference.phone)) {
      errors[`references.${index}.phone`] = 'Please enter a valid phone number (XXX-XXX-XXXX)';
    }
    if (!reference.relationship?.trim()) {
      errors[`references.${index}.relationship`] = 'Relationship is required';
    }
  });

  return errors;
};

// Add validation function for review step
const validateReview = (values: Partial<ApplicationFormData>) => {
  const errors: { [key: string]: string } = {};
  
  if (!values.acknowledgeDisqualification) {
    errors.acknowledgeDisqualification = 'You must acknowledge this statement';
  }
  if (!values.acknowledgeVerification) {
    errors.acknowledgeVerification = 'You must acknowledge this statement';
  }
  if (!values.acknowledgeBackgroundCheck) {
    errors.acknowledgeBackgroundCheck = 'You must acknowledge this statement';
  }

  return errors;
};

// Add this function before the ApplicationForm component
const canPrintApplication = (formData: ApplicationFormData) => {
  return (
    formData.acknowledgeDisqualification &&
    formData.acknowledgeVerification &&
    formData.acknowledgeBackgroundCheck
  );
};

export function ApplicationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationFormData>({
    // Initialize with empty values
    lastName: '',
    middleName: '',
    firstName: '',
    dob: '',
    currentAddress: '',
    city: '',
    stateAddress: '',
    zip: '',
    yearsAtCurrentAddress: '',
    previousAddress: '',
    cellPhone: '',
    homePhone: '',
    socialSecurity: '',
    driversLicenseNumber: '',
    gender: '',
    birthPlace: '',
    citizenship: '',
    education: '',
    maritalStatus: '',
    spouseName: '',
    dependents: '',
    currentEmployer: '',
    employerCity: '',
    position: '',
    previousEmployer: '',
    previousEmployerCity: '',
    previousPosition: '',
    medicalConditions: false,
    medicalDetails: '',
    physicalHandicap: false,
    physicalHandicapDetails: '',
    allergies: false,
    allergyDetails: '',
    servedInMilitary: false,
    militaryDetails: '',
    professionalLicense: false,
    licenseDetails: '',
    firstAidTraining: false,
    firstAidDetails: '',
    firefightingExperience: false,
    experienceDetails: '',
    trafficViolations: false,
    trafficViolationsDetails: '',
    availableEmergencyDay: false,
    availableEmergencyEvening: false,
    availableTraining: false,
    availablePublicEvents: false,
    willingToBuyUniform: false,
    agreeToRules: false,
    upholdDepartment: false,
    maintainEquipment: false,
    references: [{
      name: '',
      address: '',
      phone: '',
      relationship: ''
    }, {
      name: '',
      address: '',
      phone: '',
      relationship: ''
    }, {
      name: '',
      address: '',
      phone: '',
      relationship: ''
    }],
    acknowledgeDisqualification: false,
    acknowledgeVerification: false,
    acknowledgeBackgroundCheck: false
  });
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 6;
  const steps = [
    'Personal Information',
    'Employment',
    'Medical & History',
    'Availability',
    'References',
    'Review & Submit'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleNext = () => {
    // Mark all fields as touched
    const allFields = Object.keys(formData);
    const newTouched = allFields.reduce((acc, field) => ({
      ...acc,
      [field]: true
    }), {});
    setTouched(newTouched);

    // Validate based on current step
    const validationErrors = currentStep === 1 
      ? validatePersonalInfo(formData)
      : currentStep === 2 
        ? validateEmployment(formData)
        : currentStep === 3
          ? validateMedicalHistory(formData)
          : currentStep === 4
            ? validateAvailability(formData)
            : currentStep === 5
              ? validateReferences(formData)
              : currentStep === 6
                ? validateReview(formData)
                : {};
    setErrors(validationErrors);

    // Only proceed if there are no errors
    if (Object.keys(validationErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.border-red-300');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ... existing submission logic ...
    } catch (error) {
      console.error('Error submitting application:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const validationErrors = currentStep === 1 
      ? validatePersonalInfo(formData)
      : currentStep === 2 
        ? validateEmployment(formData)
        : currentStep === 3
          ? validateMedicalHistory(formData)
          : currentStep === 4
            ? validateAvailability(formData)
            : currentStep === 5
              ? validateReferences(formData)
              : currentStep === 6
                ? validateReview(formData)
                : {};
    setErrors(validationErrors);
  };

  const handlePrint = () => {
    openPrintView(formData);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border-b border-gray-200 pb-6 last:border-0">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Volunteer Application Form
          </h1>
          
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex-1 text-center text-sm ${
                    currentStep >= index + 1 ? 'text-red-600' : 'text-gray-400'
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
            <div className="h-2 flex rounded-full overflow-hidden">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 ${
                    currentStep >= index + 1 ? 'bg-red-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
            {/* Step content will go here */}
            {currentStep === 1 && (
              <PersonalInformationStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {currentStep === 2 && (
              <EmploymentStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {currentStep === 3 && (
              <MedicalHistoryStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {currentStep === 4 && (
              <AvailabilityStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {currentStep === 5 && (
              <ReferencesStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {currentStep === 6 && (
              <ReviewStep
                formData={formData}
                onChange={handleInputChange}
                errors={errors}
                touched={touched}
                onBlur={handleBlur}
              />
            )}
            {/* Add other steps similarly */}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevious}
                className={`px-4 py-2 rounded-lg ${
                  currentStep === 1
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                } print:hidden`}
                disabled={currentStep === 1}
              >
                Previous
              </button>
              <button
                type="button"
                onClick={currentStep === totalSteps && canPrintApplication(formData) ? handlePrint : handleNext}
                className={`px-4 py-2 rounded-lg print:hidden ${
                  currentStep === totalSteps
                    ? canPrintApplication(formData)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                disabled={currentStep === totalSteps && !canPrintApplication(formData)}
              >
                {currentStep === totalSteps ? 'Print Application' : 'Next'}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Add hidden print layout */}
      <div className="hidden">
        <PrintLayout formData={formData} />
      </div>
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <Loading type="spinner" className="mb-4" />
            <p className="text-center text-gray-600">Submitting application...</p>
          </div>
        </div>
      )}
    </div>
  );
} 