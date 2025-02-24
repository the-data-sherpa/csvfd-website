import { ApplicationFormData } from '../../pages/ApplicationForm';
import { usePlacesWidget } from "react-google-autocomplete";
import { useState } from 'react';

interface PersonalInformationStepProps {
  formData: ApplicationFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  errors: {
    [key: string]: string;
  };
  touched: {
    [key: string]: boolean;
  };
  onBlur: (fieldName: string) => void;
}

export function PersonalInformationStep({ 
  formData, 
  onChange, 
  errors,
  touched,
  onBlur 
}: PersonalInformationStepProps) {
  const [addressError, setAddressError] = useState('');
  const [previousAddressError, setPreviousAddressError] = useState('');

  const { ref } = usePlacesWidget({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      try {
        setAddressError('');
        if (!place || !place.address_components) {
          throw new Error('Failed to load address suggestions');
        }
        const addressComponents = place.address_components;
        if (!addressComponents) {
          throw new Error('Invalid address selected');
        }

        let streetNumber = '', route = '', city = '', state = '', zip = '';
        
        addressComponents.forEach((component: { types?: string[], long_name: string, short_name: string }) => {
          const types = component.types || [];
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.short_name;
          } else if (types.includes('postal_code')) {
            zip = component.long_name;
          }
        });

        if (!streetNumber || !route) {
          throw new Error('Please select a complete street address');
        }

        const fullAddress = `${streetNumber} ${route}`.trim();
        const updates = {
          currentAddress: fullAddress,
          city,
          stateAddress: state,
          zip
        };

        Object.entries(updates).forEach(([field, value]) => {
          const event = {
            target: {
              name: field,
              value: value
            }
          } as React.ChangeEvent<HTMLInputElement>;
          onChange(event);
        });
      } catch (error) {
        setAddressError(error instanceof Error ? error.message : 'Failed to process address');
        console.error('Places API Error:', error);
      }
    },
    options: {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    }
  });

  const { ref: previousAddressRef } = usePlacesWidget({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      try {
        setPreviousAddressError('');
        if (!place || !place.address_components) {
          throw new Error('Failed to load address suggestions');
        }
        const addressComponents = place.address_components;
        if (!addressComponents) {
          throw new Error('Invalid address selected');
        }

        let streetNumber = '', route = '';
        
        addressComponents.forEach((component: { types?: string[], long_name: string, short_name: string }) => {
          const types = component.types || [];
          if (types.includes('street_number')) {
            streetNumber = component.long_name;
          } else if (types.includes('route')) {
            route = component.long_name;
          }
        });

        if (!streetNumber || !route) {
          throw new Error('Please select a complete street address');
        }

        const fullAddress = `${streetNumber} ${route}`.trim();
        
        const event = {
          target: {
            name: 'previousAddress',
            value: fullAddress
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      } catch (error) {
        setPreviousAddressError(error instanceof Error ? error.message : 'Failed to process address');
        console.error('Places API Error:', error);
      }
    },
    options: {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    }
  });

  const showError = (fieldName: string) => {
    return touched[fieldName] && errors[fieldName] ? (
      <p className="mt-1 text-sm text-red-600">{errors[fieldName]}</p>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            onBlur={() => onBlur('lastName')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.lastName && errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('lastName')}
        </div>
        <div>
          <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
            Middle Name
          </label>
          <input
            type="text"
            id="middleName"
            name="middleName"
            value={formData.middleName}
            onChange={onChange}
            onBlur={() => onBlur('middleName')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.middleName && errors.middleName ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('middleName')}
        </div>
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            onBlur={() => onBlur('firstName')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.firstName && errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('firstName')}
        </div>
      </div>

      <div>
        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <input
          type="date"
          id="dob"
          name="dob"
          value={formData.dob}
          onChange={onChange}
          onBlur={() => onBlur('dob')}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
            ${touched.dob && errors.dob ? 'border-red-300' : 'border-gray-300'}`}
        />
        {showError('dob')}
      </div>

      <div>
        <label htmlFor="currentAddress" className="block text-sm font-medium text-gray-700">
          Current Address
        </label>
        <input
          ref={ref as unknown as React.LegacyRef<HTMLInputElement>}
          type="text" 
          id="currentAddress"
          name="currentAddress"
          placeholder="Start typing your address..."
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
            ${touched.currentAddress && errors.currentAddress ? 'border-red-300' : 'border-gray-300'}`}
        />
        {addressError && (
          <p className="mt-1 text-sm text-red-600">{addressError}</p>
        )}
      </div>

      {/* Years at Current Address */}
      <div>
        <label htmlFor="yearsAtCurrentAddress" className="block text-sm font-medium text-gray-700">
          Years at Current Address
        </label>
        <input
          type="text"
          id="yearsAtCurrentAddress"
          name="yearsAtCurrentAddress"
          value={formData.yearsAtCurrentAddress}
          onChange={onChange}
          onBlur={() => onBlur('yearsAtCurrentAddress')}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
            ${touched.yearsAtCurrentAddress && errors.yearsAtCurrentAddress ? 'border-red-300' : 'border-gray-300'}`}
        />
        {showError('yearsAtCurrentAddress')}
      </div>

      {/* Previous Address */}
      <div>
        <label htmlFor="previousAddress" className="block text-sm font-medium text-gray-700">
          Previous Address
        </label>
        <input
          ref={previousAddressRef as unknown as React.LegacyRef<HTMLInputElement>}
          type="text"
          id="previousAddress"
          name="previousAddress"
          placeholder="Start typing your previous address..."
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
            ${touched.previousAddress && errors.previousAddress ? 'border-red-300' : 'border-gray-300'}`}
        />
        {previousAddressError && (
          <p className="mt-1 text-sm text-red-600">{previousAddressError}</p>
        )}
      </div>

      {/* Phone Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="cellPhone" className="block text-sm font-medium text-gray-700">
            Cell Phone
          </label>
          <input
            type="tel"
            id="cellPhone"
            name="cellPhone"
            value={formData.cellPhone}
            onChange={onChange}
            onBlur={() => onBlur('cellPhone')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.cellPhone && errors.cellPhone ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('cellPhone')}
        </div>
        <div>
          <label htmlFor="homePhone" className="block text-sm font-medium text-gray-700">
            Home Phone
          </label>
          <input
            type="tel"
            id="homePhone"
            name="homePhone"
            value={formData.homePhone}
            onChange={onChange}
            onBlur={() => onBlur('homePhone')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.homePhone && errors.homePhone ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('homePhone')}
        </div>
      </div>

      {/* Social Security and Driver's License */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="socialSecurity" className="block text-sm font-medium text-gray-700">
            Social Security Number
          </label>
          <input
            type="password"
            id="socialSecurity"
            name="socialSecurity"
            value={formData.socialSecurity}
            onChange={onChange}
            onBlur={() => onBlur('socialSecurity')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.socialSecurity && errors.socialSecurity ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('socialSecurity')}
        </div>
        <div>
          <label htmlFor="driversLicenseNumber" className="block text-sm font-medium text-gray-700">
            Driver's License Number
          </label>
          <input
            type="text"
            id="driversLicenseNumber"
            name="driversLicenseNumber"
            value={formData.driversLicenseNumber}
            onChange={onChange}
            onBlur={() => onBlur('driversLicenseNumber')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.driversLicenseNumber && errors.driversLicenseNumber ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('driversLicenseNumber')}
        </div>
      </div>

      {/* Personal Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={onChange}
            onBlur={() => onBlur('gender')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.gender && errors.gender ? 'border-red-300' : 'border-gray-300'}`}
          >
            <option value="">Select...</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          {showError('gender')}
        </div>
        <div>
          <label htmlFor="birthPlace" className="block text-sm font-medium text-gray-700">
            Place of Birth
          </label>
          <input
            type="text"
            id="birthPlace"
            name="birthPlace"
            value={formData.birthPlace}
            onChange={onChange}
            onBlur={() => onBlur('birthPlace')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.birthPlace && errors.birthPlace ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('birthPlace')}
        </div>
      </div>

      {/* Citizenship and Education */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="citizenship" className="block text-sm font-medium text-gray-700">
            Citizenship
          </label>
          <input
            type="text"
            id="citizenship"
            name="citizenship"
            value={formData.citizenship}
            onChange={onChange}
            onBlur={() => onBlur('citizenship')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.citizenship && errors.citizenship ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('citizenship')}
        </div>
        <div>
          <label htmlFor="education" className="block text-sm font-medium text-gray-700">
            Education Level
          </label>
          <input
            type="text"
            id="education"
            name="education"
            value={formData.education}
            onChange={onChange}
            onBlur={() => onBlur('education')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.education && errors.education ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('education')}
        </div>
      </div>

      {/* Marital Status and Family */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="maritalStatus" className="block text-sm font-medium text-gray-700">
            Marital Status
          </label>
          <select
            id="maritalStatus"
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={onChange}
            onBlur={() => onBlur('maritalStatus')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.maritalStatus && errors.maritalStatus ? 'border-red-300' : 'border-gray-300'}`}
          >
            <option value="">Select...</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="divorced">Divorced</option>
            <option value="widowed">Widowed</option>
          </select>
          {showError('maritalStatus')}
        </div>
        <div>
          <label htmlFor="spouseName" className="block text-sm font-medium text-gray-700">
            Spouse's Name
          </label>
          <input
            type="text"
            id="spouseName"
            name="spouseName"
            value={formData.spouseName}
            onChange={onChange}
            onBlur={() => onBlur('spouseName')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.spouseName && errors.spouseName ? 'border-red-300' : 'border-gray-300'}`}
          />
          {showError('spouseName')}
        </div>
        <div>
          <label htmlFor="dependents" className="block text-sm font-medium text-gray-700">
            Number of Dependents
          </label>
          <input
            type="number"
            id="dependents"
            name="dependents"
            value={formData.dependents}
            onChange={onChange}
            onBlur={() => onBlur('dependents')}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 
              ${touched.dependents && errors.dependents ? 'border-red-300' : 'border-gray-300'}`}
            min="0"
          />
          {showError('dependents')}
        </div>
      </div>
    </div>
  );
} 