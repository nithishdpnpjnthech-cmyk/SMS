import nodemailer from 'nodemailer';
import axios from 'axios';

// Email Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEnrollmentEmail = async (data: {
    studentName: string;
    programName: string;
    parentName: string;
    parentPhone: string;
    parentEmail: string;
}) => {
    const mailOptions = {
        from: `"Huura Academy" <${process.env.EMAIL_USER}>`,
        to: data.parentEmail,
        subject: 'Huura Academy Enrollment Confirmation',
        text: `Dear Parent/Guardian,

Thank you for enrolling your child at Huura Academy.

We have successfully received the enrollment.

Student Name: ${data.studentName}
Program: ${data.programName}
Parent Name: ${data.parentName}
Phone Number: ${data.parentPhone}
Email: ${data.parentEmail}

Our team will contact you soon regarding class schedule and further details.

Thank you for choosing Huura Academy.

Best Regards,
Huura Academy Team`,
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Email credentials not set. Skipping email sending.');
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log(`Enrollment email sent to ${data.parentEmail}`);
    } catch (error) {
        console.error('Error sending enrollment email:', error);
    }
};

export const sendEnrollmentSMS = async (data: {
    studentName: string;
    programName: string;
    parentPhone: string;
}) => {
    const message = `Dear Parent/Guardian,

Thank you for enrolling your child at Huura Academy.

Student: ${data.studentName}
Program: ${data.programName}

Our team will contact you shortly with further details.

- Huura Academy`;

    try {
        const fast2smsKey = process.env.FAST2SMS_API_KEY;
        if (!fast2smsKey) {
            console.warn('Fast2SMS API key not set. Skipping SMS sending.');
            return;
        }

        // Fast2SMS POST API
        const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            message: message,
            language: 'english',
            route: 'q',
            numbers: data.parentPhone,
        }, {
            headers: {
                'authorization': fast2smsKey,
            }
        });

        if (response.data.return) {
            console.log(`Enrollment SMS sent to ${data.parentPhone}`);
        } else {
            console.error('Fast2SMS Error:', response.data.message);
        }
    } catch (error) {
        console.error('Error sending enrollment SMS:', error);
    }
};
