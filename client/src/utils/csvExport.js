// Utility function to convert data to CSV format and trigger download
export const exportToCSV = (data, filename, headers) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV content
  let csvContent = '';
  
  // Add headers if provided
  if (headers && headers.length > 0) {
    csvContent += headers.map(header => `"${header}"`).join(',') + '\n';
  }
  
  // Add data rows
  data.forEach(row => {
    const csvRow = Object.values(row).map(value => {
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '""';
      }
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return `"${stringValue}"`;
    });
    csvContent += csvRow.join(',') + '\n';
  });

  // Create and trigger download with BOM for proper UTF-8 encoding
  const BOM = '\uFEFF'; // Byte Order Mark for UTF-8
  const csvContentWithBOM = BOM + csvContent;
  const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Helper function to format patient data for CSV export
export const formatPatientDataForCSV = (patients) => {
  return patients.map(patient => ({
    'Name': patient.relationship === "self" ? (patient.userId?.name || 'N/A') : (patient.familyMemberName || 'N/A'),
    'Age': patient.DOB ? calculateAge(patient.DOB) : 'N/A',
    'Phone': patient.userId?.phone || 'N/A',
    'Email': patient.userId?.email || 'N/A',
    'Relationship': patient.relationship || 'N/A',
    'Triage': patient.triage || 'N/A',
    'Gender': patient.userId?.gender || 'N/A',
    'Blood Group': patient.userId?.bloodGroup || 'N/A'
  }));
};

// Helper function to format doctor data for CSV export
export const formatDoctorDataForCSV = (doctors) => {
  return doctors.map(doctor => ({
    'Name': doctor.user_id?.name || 'N/A',
    'Specialty': doctor.specializations && doctor.specializations.length > 0 
      ? doctor.specializations.join(', ') 
      : 'General Practice',
    'Email': doctor.user_id?.email || 'N/A',
    'Phone': doctor.user_id?.phone || 'N/A',
    'Status': getDoctorStatus(doctor.availability)
  }));
};

// Helper function to calculate age (copied from PatientList component)
const calculateAge = (DOB) => {
  if (!DOB) return 'N/A';

  const today = new Date();
  const birthDate = new Date(DOB);

  if (isNaN(birthDate.getTime())) return 'N/A';

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : 'N/A';
};

// Helper function to determine doctor status (copied from DoctorList component)
const getDoctorStatus = (availability) => {
  if (!availability || !Array.isArray(availability)) return 'On Leave';
  
  const totalSlots = availability.reduce((total, day) => {
    return total + (day.slots ? day.slots.length : 0);
  }, 0);
  
  return totalSlots > 0 ? 'Active' : 'On Leave';
};

// Helper function to format invoice data for CSV export
export const formatInvoiceDataForCSV = (invoices) => {
  return invoices.map(invoice => ({
    'Patient Name': invoice.patient_id?.name || 'N/A',
    'Patient Email': invoice.patient_id?.email || 'N/A',
    'Invoice Date': invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : 'N/A',
    'Total Amount': `Rs ${invoice.total_amount?.toFixed(2) || '0.00'}`,
    'Status': invoice.status || 'N/A',
    'Invoice ID': invoice._id || 'N/A'
  }));
};

// Helper function to format GST clinic invoice data for CSV export
export const formatGstClinicDataForCSV = (gstInvoices) => {
  return gstInvoices.map(invoice => ({
    'Invoice Number': invoice.invoiceNumber || 'N/A',
    'Invoice Date': invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : 'N/A',
    'Customer Name': invoice.customerName || 'N/A',
    'HSN/SAC Code': invoice.hsnOrSacCode || 'N/A',
    'Taxable Value': `Rs ${invoice.taxableValue?.toFixed(2) || '0.00'}`,
    'CGST': `Rs ${invoice.cgst?.toFixed(2) || '0.00'}`,
    'SGST': `Rs ${invoice.sgst?.toFixed(2) || '0.00'}`,
    'Total GST': `Rs ${invoice.totalGst?.toFixed(2) || '0.00'}`,
    'Place of Supply': invoice.placeOfSupply || 'N/A'
  }));
};
