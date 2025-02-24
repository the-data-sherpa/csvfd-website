import { ApplicationFormData } from '../../pages/ApplicationForm';

interface ReviewStepProps {
  formData: ApplicationFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors: { [key: string]: string };
  touched: { [key: string]: boolean };
  onBlur: (fieldName: string) => void;
}

export const PrintLayout = ({ formData }: { formData: ApplicationFormData }) => {
  // Helper function to render the header on each page
  const PageHeader = () => (
    <div className="page-header">
      <h1 className="text-2xl font-bold">COOL SPRINGS VOLUNTEER FIRE DEPARTMENT</h1>
      <h2 className="text-xl">Application for Membership</h2>
    </div>
  );

  // Helper function for yes/no questions
  const YesNoBox = ({ value }: { value: boolean }) => (
    <div className="border border-black px-2 min-w-[40px] text-center">
      {value ? 'YES' : 'NO'}
    </div>
  );

  return (
    <div id="print-layout" className="print:block bg-white">
      {/* Page 1: Header and Personal Information */}
      <div className="no-break">
        <PageHeader />
        
        {/* Department Use Only Box */}
        <div className="border border-black p-4 mb-8 w-48 text-sm">
          <p className="font-bold mb-2">(Fire Department use only)</p>
          <div className="grid gap-1">
            <div>Member Received:_______</div>
            <div>Unit Number:_______</div>
            <div>Date Received:_______</div>
          </div>
        </div>

        <section>
          <h3 className="font-bold border-b border-black mb-4">PERSONAL INFORMATION</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.lastName}</div>
              <div className="text-sm">LAST NAME</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.middleName}</div>
              <div className="text-sm">MIDDLE NAME</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.firstName}</div>
              <div className="text-sm">FIRST NAME</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.currentAddress}</div>
              <div className="text-sm">CURRENT HOME ADDRESS</div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.city}</div>
              <div className="text-sm">CITY</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.stateAddress}</div>
              <div className="text-sm">STATE</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.zip}</div>
              <div className="text-sm">ZIP</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.dob}</div>
              <div className="text-sm">DATE OF BIRTH</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.yearsAtCurrentAddress}</div>
              <div className="text-sm">YEARS AT CURRENT ADDRESS</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.previousAddress}</div>
              <div className="text-sm">YEARS AT PREVIOUS ADDRESS</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.cellPhone}</div>
              <div className="text-sm">CELL PHONE</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.homePhone}</div>
              <div className="text-sm">HOME PHONE</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.socialSecurity}</div>
              <div className="text-sm">SOCIAL SECURITY NUMBER</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.driversLicenseNumber}</div>
              <div className="text-sm">DRIVER'S LICENSE NUMBER</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.gender}</div>
              <div className="text-sm">GENDER</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.birthPlace}</div>
              <div className="text-sm">BIRTH PLACE</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.citizenship}</div>
              <div className="text-sm">CITIZENSHIP</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.education}</div>
              <div className="text-sm">EDUCATION LEVEL</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.maritalStatus}</div>
              <div className="text-sm">MARITAL STATUS</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.spouseName}</div>
              <div className="text-sm">SPOUSE'S NAME</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.dependents}</div>
              <div className="text-sm">DEPENDENTS (IF ANY)</div>
            </div>
          </div>
        </section>
      </div>

      {/* Page 2: Employment and Medical History */}
      <div className="page-break no-break">
        <PageHeader />
        <section>
          <h3 className="font-bold border-b border-black mb-4">EMPLOYMENT</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.currentEmployer}</div>
              <div className="text-sm">EMPLOYER</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.employerCity}</div>
              <div className="text-sm">CITY</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.position}</div>
              <div className="text-sm">POSITION</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="border-b border-dotted border-black">{formData.previousEmployer}</div>
              <div className="text-sm">PREVIOUS EMPLOYER</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.previousEmployerCity}</div>
              <div className="text-sm">CITY</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black">{formData.previousPosition}</div>
              <div className="text-sm">POSITION</div>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-bold border-b border-black mb-4">MEDICAL HISTORY</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Do you currently have any medical problems?</span>
              <YesNoBox value={formData.medicalConditions} />
            </div>
            {formData.medicalConditions && (
              <div className="border-b border-dotted border-black pl-8">{formData.medicalDetails}</div>
            )}

            <div className="flex items-center justify-between">
              <span>Do you have any physical handicap that may affect your ability to perform the jobs in the fire service?</span>
              <YesNoBox value={formData.physicalHandicap} />
            </div>
            {formData.physicalHandicap && (
              <div className="border-b border-dotted border-black pl-8">{formData.physicalHandicapDetails}</div>
            )}

            <div className="flex items-center justify-between">
              <span>Are you currently allergic to anything that would cause the use of Epinephrine (EPI)?</span>
              <YesNoBox value={formData.allergies} />
            </div>
            {formData.allergies && (
              <div className="border-b border-dotted border-black pl-8">{formData.allergyDetails}</div>
            )}
          </div>
        </section>
      </div>

      {/* Page 3: Personal History */}
      <div className="page-break no-break">
        <PageHeader />
        <section>
          <h3 className="font-bold border-b border-black mb-4">PERSONAL HISTORY</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Have you ever served in the United States Military?</span>
              <YesNoBox value={formData.servedInMilitary} />
            </div>

            <div className="flex items-center justify-between">
              <span>Do you have a license, certificate, or other authorization to practice a trade or profession?</span>
              <YesNoBox value={formData.professionalLicense} />
            </div>
            {formData.professionalLicense && (
              <div className="border-b border-dotted border-black pl-8">{formData.licenseDetails}</div>
            )}

            <div className="flex items-center justify-between">
              <span>Do you have any previous first aid or CPR training?</span>
              <YesNoBox value={formData.firstAidTraining} />
            </div>
            {formData.firstAidTraining && (
              <div className="border-b border-dotted border-black pl-8">{formData.firstAidDetails}</div>
            )}

            <div className="flex items-center justify-between">
              <span>Do you have any previous firefighting or EMS experience?</span>
              <YesNoBox value={formData.firefightingExperience} />
            </div>
            {formData.firefightingExperience && (
              <div className="border-b border-dotted border-black pl-8">{formData.experienceDetails}</div>
            )}
          </div>
        </section>
      </div>

      {/* Page 4: Availability & Commitment */}
      <div className="page-break no-break">
        <PageHeader />
        <section>
          <h3 className="font-bold border-b border-black mb-4">AVAILABILITY & COMMITMENT</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Are you available for emergency calls during the day?</span>
              <YesNoBox value={formData.availableEmergencyDay} />
            </div>

            <div className="flex items-center justify-between">
              <span>Are you available for emergency calls during the evening?</span>
              <YesNoBox value={formData.availableEmergencyEvening} />
            </div>

            <div className="flex items-center justify-between">
              <span>Are you willing to attend training classes and drills? (Minimum 36 hours per year)</span>
              <YesNoBox value={formData.availableTraining} />
            </div>

            <div className="flex items-center justify-between">
              <span>Are you willing to participate in public relation events?</span>
              <YesNoBox value={formData.availablePublicEvents} />
            </div>

            <div className="flex items-center justify-between">
              <span>Will you buy the required uniform?</span>
              <YesNoBox value={formData.willingToBuyUniform} />
            </div>

            <div className="flex items-center justify-between">
              <span>Will you abide by the By-laws and Rules of The Cool Springs Volunteer Fire Department?</span>
              <YesNoBox value={formData.agreeToRules} />
            </div>

            <div className="flex items-center justify-between">
              <span>Will you uphold The Cool Springs Volunteer Fire Department and its members in the highest esteem and respect?</span>
              <YesNoBox value={formData.upholdDepartment} />
            </div>

            <div className="flex items-center justify-between">
              <span>Will you take care of all department issued equipment, and report any problems as soon as you can?</span>
              <YesNoBox value={formData.maintainEquipment} />
            </div>
          </div>
        </section>
      </div>

      {/* Page 5: References and Signature */}
      <div className="page-break no-break">
        <PageHeader />
        <section>
          <h3 className="font-bold border-b border-black mb-4">REFERENCES</h3>
          {formData.references.map((ref, index) => (
            <div key={index} className="mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="border-b border-dotted border-black">{ref.name}</div>
                  <div className="text-sm">NAME</div>
                </div>
                <div>
                  <div className="border-b border-dotted border-black">{ref.address}</div>
                  <div className="text-sm">ADDRESS</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="border-b border-dotted border-black">{ref.phone}</div>
                  <div className="text-sm">PHONE NUMBER</div>
                </div>
                <div>
                  <div className="border-b border-dotted border-black">{ref.relationship}</div>
                  <div className="text-sm">RELATIONSHIP</div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="space-y-4 mb-8">
            <p className="text-sm">
              I understand that answering the questions above, this does not automatically disqualify me from becoming a member of Cool Springs Volunteer Fire Department.
            </p>
            <p className="text-sm">
              Permission is given to the Cool Springs Volunteer Fire Department to verify any and all information.
            </p>
            <p className="text-sm">
              I acknowledge by completing the background check at the Iredell County Sheriff's Office, my criminal records will be sent directly to Cool Springs Volunteer Fire Department.
            </p>
            <p className="text-sm font-bold mt-6">
              I hereby certify that the information contained in this application is true to the best of my belief and knowledge.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-8">
            <div>
              <div className="border-b border-dotted border-black min-h-[2rem]"></div>
              <div className="text-sm">SIGNATURE</div>
            </div>
            <div>
              <div className="border-b border-dotted border-black min-h-[2rem]"></div>
              <div className="text-sm">DATE</div>
            </div>
          </div>
        </section>

        {/* Page Number */}
        <div className="text-right text-sm mt-4">
          Page 5 of 5
        </div>
      </div>
    </div>
  );
};

// Export the openPrintView function
export const openPrintView = (formData: ApplicationFormData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const styles = `
    @page { 
      margin: 0; 
      size: auto; 
    }
    body { 
      margin: 0; 
      padding: 0; 
      background: white; 
    }
    .print-layout { 
      background: white;
      padding: 40px;
      max-width: 8.5in;
      margin: 0 auto;
    }
    /* Add some spacing between sections */
    section {
      margin-bottom: 20px;
    }
    /* Force page breaks */
    .page-break {
      page-break-before: always;
      margin-top: 30px;
    }
    /* Prevent unwanted breaks */
    .no-break {
      page-break-inside: avoid;
    }
    /* Ensure text is black for printing */
    * {
      color: black !important;
    }
    /* Ensure borders are visible */
    .border-dotted {
      border-bottom: 1px dotted #000 !important;
    }
    .border {
      border: 1px solid #000 !important;
    }
    /* Ensure proper spacing for input fields */
    .border-b {
      min-height: 1.5em;
      margin-bottom: 4px;
    }
    /* Header styling for each page */
    .page-header {
      text-align: center;
      margin-bottom: 20px;
    }
  `;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Application Form - Print View</title>
        <style>${styles}</style>
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      </head>
      <body>
        <div class="print-layout">
          ${document.getElementById('print-layout')?.innerHTML || ''}
        </div>
        <script>
          window.onload = () => {
            window.print();
            // Uncomment the next line if you want the print window to close after printing
            // window.onafterprint = () => window.close();
          }
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};

export function ReviewStep({ formData, onChange, errors, touched, onBlur }: ReviewStepProps) {
  const renderSection = (title: string, fields: { label: string; value: string | boolean }[]) => (
    <div className="mb-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        {fields.map(({ label, value }, index) => (
          <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="font-medium text-gray-700">{label}</div>
            <div className="md:col-span-2 text-gray-900">
              {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || 'Not provided'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Screen-only content */}
      <div className="print:hidden">
        <div className="space-y-6 relative pb-16">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please review all information carefully before submitting. You cannot edit after submission.
                </p>
              </div>
            </div>
          </div>

          {renderSection('Personal Information', [
            { label: 'Name', value: `${formData.firstName} ${formData.middleName} ${formData.lastName}` },
            { label: 'Date of Birth', value: formData.dob },
            { label: 'Current Address', value: formData.currentAddress },
            { label: 'Years at Address', value: formData.yearsAtCurrentAddress },
            { label: 'Previous Address', value: formData.previousAddress },
            { label: 'Cell Phone', value: formData.cellPhone },
            { label: 'Home Phone', value: formData.homePhone },
            { label: 'Social Security', value: '***-**-****' }, // Masked for security
            { label: "Driver's License", value: formData.driversLicenseNumber },
            { label: 'Gender', value: formData.gender },
            { label: 'Birth Place', value: formData.birthPlace },
            { label: 'Citizenship', value: formData.citizenship },
            { label: 'Education', value: formData.education },
            { label: 'Marital Status', value: formData.maritalStatus },
            { label: "Spouse's Name", value: formData.spouseName || 'N/A' },
            { label: 'Dependents', value: formData.dependents || '0' }
          ])}

          {renderSection('Employment', [
            { label: 'Current Employer', value: formData.currentEmployer },
            { label: 'Employer City', value: formData.employerCity },
            { label: 'Position', value: formData.position },
            { label: 'Previous Employer', value: formData.previousEmployer || 'N/A' },
            { label: 'Previous Employer City', value: formData.previousEmployerCity || 'N/A' },
            { label: 'Previous Position', value: formData.previousPosition || 'N/A' }
          ])}

          {renderSection('Medical History', [
            { label: 'Medical Conditions', value: formData.medicalConditions },
            ...(formData.medicalConditions ? [{ label: 'Details', value: formData.medicalDetails || '' }] : []),
            { label: 'Physical Handicap', value: formData.physicalHandicap },
            ...(formData.physicalHandicap ? [{ label: 'Details', value: formData.physicalHandicapDetails || '' }] : []),
            { label: 'Allergies', value: formData.allergies },
            ...(formData.allergies ? [{ label: 'Details', value: formData.allergyDetails || '' }] : [])
          ])}

          {renderSection('Personal History', [
            { label: 'Military Service', value: formData.servedInMilitary },
            { label: 'Professional License', value: formData.professionalLicense },
            ...(formData.professionalLicense ? [{ label: 'License Details', value: formData.licenseDetails || '' }] : []),
            { label: 'First Aid Training', value: formData.firstAidTraining },
            ...(formData.firstAidTraining ? [{ label: 'Training Details', value: formData.firstAidDetails || '' }] : []),
            { label: 'Firefighting Experience', value: formData.firefightingExperience },
            ...(formData.firefightingExperience ? [{ label: 'Experience Details', value: formData.experienceDetails || '' }] : []),
            { label: 'Traffic Violations', value: formData.trafficViolations },
            ...(formData.trafficViolations ? [{ label: 'Violation Details', value: formData.trafficViolationsDetails || '' }] : [])
          ])}

          {renderSection('Availability & Commitment', [
            { label: 'Available for Day Emergencies', value: formData.availableEmergencyDay },
            { label: 'Available for Evening Emergencies', value: formData.availableEmergencyEvening },
            { label: 'Will Attend Training', value: formData.availableTraining },
            { label: 'Will Participate in Public Events', value: formData.availablePublicEvents },
            { label: 'Will Buy Uniform', value: formData.willingToBuyUniform },
            { label: 'Agrees to Rules', value: formData.agreeToRules },
            { label: 'Will Uphold Department', value: formData.upholdDepartment },
            { label: 'Will Maintain Equipment', value: formData.maintainEquipment }
          ])}

          {renderSection('References', formData.references.map((ref, index) => [
            { label: `Reference ${index + 1} Name`, value: ref.name },
            { label: `Reference ${index + 1} Address`, value: ref.address },
            { label: `Reference ${index + 1} Phone`, value: ref.phone },
            { label: `Reference ${index + 1} Relationship`, value: ref.relationship }
          ]).flat())}

          <div className="mt-8 space-y-6">
            <div className="border-t border-gray-200 pt-8">
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acknowledgments</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="acknowledgeDisqualification"
                        name="acknowledgeDisqualification"
                        checked={formData.acknowledgeDisqualification}
                        onChange={onChange}
                        onBlur={() => onBlur('acknowledgeDisqualification')}
                        className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="acknowledgeDisqualification" className="text-sm text-gray-700">
                        I understand that answering the questions above, this does not automatically disqualify me from becoming a member of Cool Springs Volunteer Fire Department.
                      </label>
                      {touched.acknowledgeDisqualification && errors.acknowledgeDisqualification && (
                        <p className="mt-1 text-sm text-red-600">{errors.acknowledgeDisqualification}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="acknowledgeVerification"
                        name="acknowledgeVerification"
                        checked={formData.acknowledgeVerification}
                        onChange={onChange}
                        onBlur={() => onBlur('acknowledgeVerification')}
                        className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="acknowledgeVerification" className="text-sm text-gray-700">
                        Permission is given to the Cool Springs Volunteer Fire Department to verify any and all information.
                      </label>
                      {touched.acknowledgeVerification && errors.acknowledgeVerification && (
                        <p className="mt-1 text-sm text-red-600">{errors.acknowledgeVerification}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="acknowledgeBackgroundCheck"
                        name="acknowledgeBackgroundCheck"
                        checked={formData.acknowledgeBackgroundCheck}
                        onChange={onChange}
                        onBlur={() => onBlur('acknowledgeBackgroundCheck')}
                        className="focus:ring-red-500 h-4 w-4 text-red-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="acknowledgeBackgroundCheck" className="text-sm text-gray-700">
                        I acknowledge by completing the background check at the Iredell County Sheriff's Office, my criminal records will be sent directly to Cool Springs Volunteer Fire Department.
                      </label>
                      {touched.acknowledgeBackgroundCheck && errors.acknowledgeBackgroundCheck && (
                        <p className="mt-1 text-sm text-red-600">{errors.acknowledgeBackgroundCheck}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden print layout */}
      <div className="hidden">
        <PrintLayout formData={formData} />
      </div>
    </>
  );
} 