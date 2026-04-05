import axios from 'axios';

interface WhatsAppMessage {
  type: 'text';
  text: string;
}

interface WhatsAppFileMessage {
  type: 'file';
  url: string;
  filename: string;
}

interface WhatsAppParams {
  message: string;
  channel: 'whatsapp';
  source: string;
  destination: number;
  'src.name': string;
}

export class WhatsAppService {
  private apiKey: string;
  private sourceNumber: string;
  private sourceName: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.GUPSHUP_API_KEY || '07cqn2hskrevchmml16tsntawox92k00';
    this.sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER || '919958502197';
    this.sourceName = process.env.GUPSHUP_SOURCE_NAME || 'PrevaCare';
    this.baseUrl = 'https://api.gupshup.io/wa/api/v1/msg';
  }

  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');

    // If number starts with 91, return as is
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return cleaned;
    }

    // If number is 10 digits, add 91 prefix
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }

    // If number is already 12 digits with country code, return as is
    if (cleaned.length === 12) {
      return cleaned;
    }

    // Default fallback - add 91 prefix
    return `91${cleaned}`;
  }


  async optInUser(destinationNumber: string): Promise<any> {
    try {
      const formattedNumber = this.formatPhoneNumber(destinationNumber);
      console.log('WhatsApp Service Debug - Opting in user:', destinationNumber, '->', formattedNumber)

      const encodedParams = new URLSearchParams();
      encodedParams.set('user', formattedNumber);

      const options = {
        method: 'POST',
        url: 'https://api.gupshup.io/sm/api/v1/app/opt/in/PrevaCare',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: this.apiKey
        },
        data: encodedParams,
      };

      console.log('WhatsApp Service Debug - Making opt-in API request')
      const response = await axios.request(options);
      console.log('optin response '+ response.data)
      // Check if opt-in was successful
      if (response.data && response.status === 200) {
        console.log('✅ WhatsApp OPT-IN SUCCESSFUL for:', formattedNumber);
        console.log('✅ Opt-in Response:', response.data);
      } else {
        console.log('❌ WhatsApp OPT-IN FAILED for:', formattedNumber);
        console.log('❌ Opt-in Response:', response.data);
      }

      return response.data;
    } catch (error: any) {
      console.log('❌ WhatsApp OPT-IN FAILED for:', destinationNumber);
      console.error('❌ Error opting in user:', error);
      console.error('❌ WhatsApp Opt-in Error Details:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      // Don't throw error for opt-in failures, continue with message sending
      return null;
    }
  }

  async sendMessage(messageText: string, destinationNumber?: string): Promise<any> {
    try {
      // Use provided destination number or fallback to default
      const rawDestination = destinationNumber || '919214061551';
      const destination = this.formatPhoneNumber(rawDestination);

      console.log('WhatsApp Service Debug - Starting message send')
      console.log('WhatsApp Service Debug - Raw Destination:', rawDestination)
      console.log('WhatsApp Service Debug - Formatted Destination:', destination)
      console.log('WhatsApp Service Debug - Source:', this.sourceNumber)
      console.log('WhatsApp Service Debug - Message length:', messageText.length)

      // First, opt-in the user
      await this.optInUser(rawDestination);

      const message: WhatsAppMessage = {
        type: 'text',
        text: messageText
      };

      const encodedParams = new URLSearchParams();
      encodedParams.set('message', JSON.stringify(message));
      encodedParams.set('channel', 'whatsapp');
      encodedParams.set('source', this.sourceNumber);
      encodedParams.set('destination', destination);
      encodedParams.set('src.name', this.sourceName);

      console.log('WhatsApp Service Debug - Encoded params:', encodedParams.toString())

      const options = {
        method: 'POST',
        url: this.baseUrl,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: this.apiKey
        },
        data: encodedParams,
      };

      console.log('WhatsApp Service Debug - Making API request to:', this.baseUrl)
      const response = await axios.request(options);
      console.log('WhatsApp message sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      console.error('WhatsApp Service Error Details:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to send WhatsApp message: ${error}`);
    }
  }

  async sendFileMessage(fileUrl: string, filename: string, destinationNumber?: string): Promise<any> {
    try {
      // Use provided destination number or fallback to default
      const rawDestination = destinationNumber || '919214061551';
      const destination = this.formatPhoneNumber(rawDestination);

      console.log('WhatsApp Service Debug - Starting file message send')
      console.log('WhatsApp Service Debug - Raw Destination:', rawDestination)
      console.log('WhatsApp Service Debug - Formatted Destination:', destination)
      console.log('WhatsApp Service Debug - File URL:', fileUrl)
      console.log('WhatsApp Service Debug - Filename:', filename)

      // First, opt-in the user
      await this.optInUser(rawDestination);

      const message: WhatsAppFileMessage = {
        type: 'file',
        url: fileUrl,
        filename: filename
      };

      const encodedParams = new URLSearchParams();
      encodedParams.set('message', JSON.stringify(message));
      encodedParams.set('channel', 'whatsapp');
      encodedParams.set('source', this.sourceNumber);
      encodedParams.set('destination', destination);
      encodedParams.set('src.name', this.sourceName);

      console.log('WhatsApp Service Debug - Encoded params for file:', encodedParams.toString())

      const options = {
        method: 'POST',
        url: this.baseUrl,
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          apikey: this.apiKey
        },
        data: encodedParams,
      };

      console.log('WhatsApp Service Debug - Making file API request to:', this.baseUrl)
      const response = await axios.request(options);
      console.log('WhatsApp file message sent successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error sending WhatsApp file message:', error);
      console.error('WhatsApp Service File Error Details:', {
        error: error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to send WhatsApp file message: ${error}`);
    }
  }

  async sendAppointmentConfirmation(
    patientName: string,
    doctorName: string,
    appointmentTime: Date,
    consultationMode: string,
    patientPhoneNumber?: string
  ): Promise<any> {
    const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const messageText = `Dear ${patientName},

Your appointment has been confirmed!

📋 Appointment Details:
📅 Date & Time: ${formattedTime}
🏥 Consultation Mode: ${consultationMode === 'tele-consultation' ? 'Video Call' : consultationMode === 'onsite' ? 'In-Person' : consultationMode === 'home-visit' ? 'Home Visit' : 'In-Person'}

Please arrive 10 minutes before your scheduled time.

For any queries, please contact us.

Best regards,
Team PrevaCare`;

    return this.sendMessage(messageText, patientPhoneNumber);
  }

  async sendTeleconsultationLink(
    patientName: string,
    doctorName: string,
    appointmentTime: Date,
    appointmentId: string,
    patientPhoneNumber?: string
  ): Promise<any> {
    const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const teleconsultationUrl = `${baseUrl}/clinic/teleconsultation/patient/${appointmentId}`;

    const messageText = `Dear ${patientName},

Your teleconsultation appointment is confirmed!

📋 Appointment Details:
📅 Date & Time: ${formattedTime}
🏥 Consultation Mode: Video Call

🔗 Join your consultation here:
${teleconsultationUrl}

Please click the link above to join your video consultation at the scheduled time.

For any technical issues, please contact us immediately.

Best regards,
Team PrevaCare`;

    return this.sendMessage(messageText, patientPhoneNumber);
  }

  async sendAppointmentReminder(
    patientName: string,
    doctorName: string,
    appointmentTime: Date,
    consultationMode: string,
    patientPhoneNumber?: string,
    appointmentId?: string
  ): Promise<any> {
    const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    let messageText = `Dear ${patientName},

Reminder: Your appointment is in 1 hour!

📋 Appointment Details:
📅 Date & Time: ${formattedTime}
🏥 Consultation Mode: ${consultationMode === 'tele-consultation' ? 'Video Call' : consultationMode === 'onsite' ? 'In-Person' : consultationMode === 'home-visit' ? 'Home Visit' : 'In-Person'}`;

    if (consultationMode === 'tele-consultation' && appointmentId) {
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const teleconsultationUrl = `${baseUrl}/clinic/teleconsultation/patient/${appointmentId}`;
      messageText += `

🔗 Join your consultation here:
${teleconsultationUrl}`;
    }

    messageText += `

Please be ready for your appointment.

Best regards,
Team PrevaCare`;

    return this.sendMessage(messageText, patientPhoneNumber);
  }

  async sendAppointmentCancellation(
    patientName: string,
    doctorName: string,
    appointmentTime: Date,
    patientPhoneNumber?: string
  ): Promise<any> {
    const formattedTime = new Date(appointmentTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });

    const messageText = `Dear ${patientName},

Your appointment has been cancelled.

📋 Cancelled Appointment Details:
📅 Date & Time: ${formattedTime}

Please contact us to reschedule your appointment.

Best regards,
Team PrevaCare`;

    return this.sendMessage(messageText, patientPhoneNumber);
  }

  async sendEmrPdfLink(
    patientName: string,
    doctorName: string,
    pdfUrl: string,
    patientPhoneNumber?: string
  ): Promise<any> {
    const messageText = `Dear ${patientName},

Your Electronic Medical Record (EMR) has been generated successfully!

📋 EMR Details:
👨‍⚕️ Doctor: Dr. ${doctorName}
📄 Document Type: Electronic Medical Record

📎 Your EMR PDF is attached to this message.

Please keep this document safe for your records.

Best regards,
Team PrevaCare`;

    // Send text message first
    await this.sendMessage(messageText, patientPhoneNumber);

    // Then send the PDF file
    const filename = `EMR_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.sendFileMessage(pdfUrl, filename, patientPhoneNumber);
  }

  async sendEprescriptionPdfLink(
    patientName: string,
    doctorName: string,
    pdfUrl: string,
    patientPhoneNumber?: string
  ): Promise<any> {
    const messageText = `Dear ${patientName},

Your E-Prescription has been generated successfully!

📋 Prescription Details:
👨‍⚕️ Doctor: Dr. ${doctorName}
📄 Document Type: E-Prescription

📎 Your prescription PDF is attached to this message.

Please follow the medication instructions carefully.

Best regards,
Team PrevaCare`;

    // Send text message first
    await this.sendMessage(messageText, patientPhoneNumber);

    // Then send the PDF file
    const filename = `Prescription_${patientName}_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.sendFileMessage(pdfUrl, filename, patientPhoneNumber);
  }

  async sendInvoicePdfLink(
    patientName: string,
    clinicName: string,
    invoiceNumber: string,
    totalAmount: number,
    pdfUrl: string,
    patientPhoneNumber?: string
  ): Promise<any> {
    const messageText = `Dear ${patientName},

Your invoice has been generated successfully!

📋 Invoice Details:
🏥 Clinic: ${clinicName}
📄 Invoice Number: ${invoiceNumber}
💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN')}

📎 Your invoice PDF is attached to this message.

Please keep this document for your records.

Best regards,
Team PrevaCare`;

    // Send text message first
    await this.sendMessage(messageText, patientPhoneNumber);

    // Then send the PDF file
    const filename = `Invoice_${invoiceNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.sendFileMessage(pdfUrl, filename, patientPhoneNumber);
  }
}

export default WhatsAppService;
