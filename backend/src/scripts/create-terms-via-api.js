const { Client } = require('pg');

const termsContent = `StoreHub Merchant Onboarding Terms and Conditions

Version: 1.1
Effective Date: January 1, 2025

1. ACCEPTANCE OF TERMS

By proceeding with the StoreHub merchant onboarding process, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). These Terms constitute a legally binding agreement between you ("Merchant") and StoreHub Sdn Bhd ("StoreHub", "we", "us", or "our").

2. ONBOARDING PROCESS

2.1 Hardware Delivery

- StoreHub will deliver the necessary point-of-sale hardware to your specified delivery address.
- Delivery timelines are estimates and may vary based on location and circumstances.
- You are responsible for providing accurate delivery information and ensuring someone is available to receive the hardware.

2.2 Payment & Contact Responsibility

- Payment for StoreHub services must be completed within 72 hours of hardware delivery.
- You must provide accurate contact information and respond to StoreHub communications promptly.
- Failure to complete payment within the specified timeframe may result in service suspension.

3. STORE SETUP AND SCHEDULING TERMS

3.1 Installation Scheduling

- Store setup appointments must be scheduled through the StoreHub onboarding system.
- Appointments are subject to trainer availability and must be confirmed at least 24 hours in advance.
- Rescheduling requests must be made at least 12 hours before the scheduled appointment.

3.2 Installation Environment Requirements

- You must ensure your store has stable Wi-Fi connectivity with minimum 10 Mbps speed.
- Adequate power points must be available near the point-of-sale location.
- LAN cables and network infrastructure must be properly installed and functional.
- The installation area must be clean, accessible, and ready for setup.

3.3 Training Session Pricing

- Standard training sessions during business hours (9 AM - 6 PM, Monday-Friday) are included in the package.
- Training sessions outside standard hours may incur additional charges as per current pricing.
- Emergency or urgent setup requests may be subject to premium pricing.

4. MERCHANT OBLIGATIONS

4.1 Information Accuracy

- You must provide complete and accurate business information during onboarding.
- Any changes to business details must be communicated to StoreHub immediately.
- False or misleading information may result in service termination.

4.2 System Usage

- You agree to use the StoreHub system in accordance with provided guidelines.
- Unauthorized modifications to hardware or software are prohibited.
- You are responsible for training your staff on proper system usage.

4.3 Compliance

- You must comply with all applicable local laws and regulations.
- Business licenses and permits must be valid and up-to-date.
- You are responsible for tax compliance and reporting.

5. SERVICE LEVELS AND SUPPORT

5.1 Technical Support

- StoreHub provides technical support during standard business hours.
- Support requests can be submitted through designated channels.
- Response times may vary based on issue complexity and priority.

5.2 Maintenance and Updates

- Regular system maintenance may cause temporary service interruptions.
- Software updates will be deployed as needed for security and functionality.
- Hardware maintenance schedules will be communicated in advance.

6. FEES AND PAYMENT TERMS

6.1 Service Fees

- Monthly service fees are due in advance on the agreed billing date.
- Late payment may result in service suspension and additional charges.
- Fee structures are subject to change with reasonable notice.

6.2 Hardware Costs

- Hardware costs are separate from monthly service fees.
- Payment terms for hardware will be specified in your service agreement.
- Hardware remains StoreHub property unless otherwise specified.

7. DATA PROTECTION AND PRIVACY

7.1 Data Collection

- StoreHub collects business and transaction data necessary for service provision.
- Personal data is handled in accordance with applicable privacy laws.
- You consent to data processing for service delivery and improvement.

7.2 Data Security

- StoreHub implements reasonable security measures to protect your data.
- You are responsible for maintaining secure access credentials.
- Data breaches will be reported as required by law.

8. LIABILITY AND INDEMNIFICATION

8.1 Limitation of Liability

- StoreHub's liability is limited to the value of services provided.
- We are not liable for indirect, consequential, or punitive damages.
- Force majeure events are excluded from liability claims.

8.2 Merchant Indemnification

- You agree to indemnify StoreHub against claims arising from your use of services.
- This includes third-party claims related to your business operations.
- Legal costs and damages may be recovered from you.

9. TERMINATION

9.1 Termination by Merchant

- You may terminate services with 30 days written notice.
- Outstanding fees must be paid before termination.
- Hardware must be returned in good condition.

9.2 Termination by StoreHub

- We may terminate services for breach of terms or non-payment.
- Immediate termination may occur for serious violations.
- Termination procedures will be communicated clearly.

10. INTELLECTUAL PROPERTY

10.1 StoreHub Property

- All software, systems, and documentation remain StoreHub property.
- You receive a limited license to use our systems for business purposes.
- Unauthorized copying or distribution is prohibited.

10.2 Merchant Content

- You retain ownership of your business data and content.
- StoreHub receives limited rights to process data for service delivery.
- Confidential information will be protected appropriately.

11. GENERAL PROVISIONS

11.1 Governing Law

- These Terms are governed by Malaysian law.
- Disputes subject to Malaysian court jurisdiction.
- Alternative dispute resolution procedures.

11.2 Amendments

- We may update these Terms with reasonable notice.
- Continued use constitutes acceptance of changes.
- Material changes require explicit consent.

11.3 Severability

- Invalid provisions do not affect remaining Terms.
- Reasonable interpretation of ambiguous clauses.
- Good faith performance expected.

12. CONTACT INFORMATION

For questions about these Terms and Conditions, please contact:

StoreHub Sdn Bhd
Email: care@storehub.com
Contact No: +60392126688

By clicking "Agree and Continue", you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.

Last Updated: January 1, 2025`;

async function createTermsAndConditions() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // First, deactivate any existing active terms
    const deactivateQuery = `
      UPDATE terms_conditions 
      SET "isActive" = false 
      WHERE "isActive" = true
    `;
    
    await client.query(deactivateQuery);
    console.log('📝 Deactivated existing terms');

    // Create new terms and conditions
    const insertQuery = `
      INSERT INTO terms_conditions (
        id, version, content, "isActive", "effectiveDate", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, true, $3, NOW(), NOW()
      ) RETURNING *
    `;

    const result = await client.query(insertQuery, [
      '1.1',
      termsContent,
      '2025-01-01'
    ]);

    const newTerms = result.rows[0];
    console.log('✅ Terms and Conditions created successfully!');
    console.log(`📄 Version: ${newTerms.version}`);
    console.log(`🆔 ID: ${newTerms.id}`);
    console.log(`📅 Effective Date: ${newTerms.effectiveDate}`);
    console.log(`✅ Active: ${newTerms.isActive}`);

  } catch (error) {
    console.error('❌ Error creating Terms and Conditions:', error);
    
    if (error.message?.includes('duplicate')) {
      console.log('💡 Terms and Conditions may already exist.');
    }
  } finally {
    await client.end();
    console.log('📡 Database connection closed');
  }
}

// Run the function
createTermsAndConditions().catch(console.error); 