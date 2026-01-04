/*
 * FLEXPASS EVENT HANDLERS
 * * Note: Envio uses a specific "context" API.
 * We use 'context.Entity.get(id)' to read and 'context.Entity.set(obj)' to write.
 */

const { FlexPass } = require("../generated/index.js");

// Helper for Service Types
const getServiceType = (typeId) => {
  const types = ["GYM", "WIFI", "POWER", "CUSTOM"];
  return types[Number(typeId)] || "CUSTOM";
};

// 1. SERVICE REGISTERED
FlexPass.ServiceRegistered.handler(async ({ event, context }) => {
  const providerAddress = event.params.provider.toString();
  
  context.ServiceProvider.set({
    id: providerAddress,
    address: providerAddress,
    serviceName: event.params.name,
    serviceType: getServiceType(event.params.serviceType),
    rate: event.params.rate,
    isActive: true,
    totalSessions: 0,
    totalRevenue: 0n,
    registeredAt: BigInt(event.block.timestamp),
    updatedAt: BigInt(event.block.timestamp)
  });
});

// 2. SESSION STARTED
FlexPass.SessionStarted.handler(async ({ event, context }) => {
  try {
    console.log('🔍 SessionStarted event received:', JSON.stringify(event.params, null, 2));
    
    const sessionId = event.params.sessionId?.toString() || `fallback-${Date.now()}`;
    const providerId = event.params.provider?.toString() || '0x0000000000000000000000000000000000000000';
    const customerId = event.params.customer?.toString() || '0x0000000000000000000000000000000000000000';
    const startTime = event.params.startTime || 0n;

    console.log('📋 Extracted params:', { sessionId, providerId, customerId, startTime });

    // Validate parameters
    if (!sessionId || sessionId === 'undefined' || sessionId === 'null') {
      console.error('❌ Invalid sessionId:', sessionId);
      return;
    }
    
    if (!providerId || providerId === '0x0000000000000000000000000000000000000000' || providerId === 'undefined') {
      console.error('❌ Invalid providerId:', providerId);
      return;
    }
    
    if (!customerId || customerId === '0x0000000000000000000000000000000000000000' || customerId === 'undefined') {
      console.error('❌ Invalid customerId:', customerId);
      return;
    }

    console.log('✅ All parameters validated');

    // A. Load or Init Customer
    let customer = await context.Customer.get(customerId);
    if (!customer) {
      customer = {
        id: customerId,
        address: customerId,
        totalSessions: 0,
        totalSpent: 0n
      };
    }
    
    // Update Customer Stats
    context.Customer.set({
      ...customer,
      totalSessions: customer.totalSessions + 1
    });

    // B. Update Provider Stats
    let provider = await context.ServiceProvider.get(providerId);
    if (provider) {
      context.ServiceProvider.set({
        ...provider,
        totalSessions: provider.totalSessions + 1,
        updatedAt: BigInt(event.block.timestamp)
      });
    }

    // C. Create Session with new schema field names
    const sessionData = {
      id: sessionId,
      sessionId: sessionId,
      providerAddress: providerId, // Use providerAddress instead of provider_id
      customerAddress: customerId, // Use customerAddress instead of customer_id
      serviceType: provider ? provider.serviceType : "CUSTOM",
      startTime: startTime,
      endTime: null, // Use null instead of 0n
      totalCost: 0n,
      isActive: true
    };

    console.log('🔍 Session data to create:', sessionData);

    // Verify customerAddress is not null
    if (!sessionData.customerAddress || sessionData.customerAddress === 'undefined' || sessionData.customerAddress === 'null') {
      console.error('❌ CRITICAL: customerAddress is null/undefined:', sessionData.customerAddress);
      return;
    }

    console.log('✅ customerAddress verified:', sessionData.customerAddress);

    context.Session.set(sessionData);
    console.log('✅ Session created successfully');

  } catch (error) {
    console.error('❌ Error in SessionStarted handler:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Emergency fallback
    try {
      console.log('🚨 Creating emergency session');
      context.Session.set({
        id: `emergency-${Date.now()}`,
        sessionId: `emergency-${Date.now()}`,
        providerAddress: '0x1111111111111111111111111111111111111111',
        customerAddress: '0x2222222222222222222222222222222222222222',
        serviceType: 'CUSTOM',
        startTime: BigInt(Math.floor(Date.now() / 1000)),
        endTime: null,
        totalCost: 0n,
        isActive: true
      });
      console.log('✅ Emergency session created');
    } catch (emergencyError) {
      console.error('❌ Emergency session creation failed:', emergencyError);
    }
  }
});

// 3. SESSION CHARGED
FlexPass.SessionCharged.handler(async ({ event, context }) => {
  const sessionId = event.params.sessionId.toString();
  const paymentId = `${event.transactionHash}-${event.logIndex}`;

  // A. Record Payment
  context.Payment.set({
    id: paymentId,
    sessionId: sessionId, // Use sessionId instead of session_id
    amount: event.params.chargeAmount,
    reason: `Usage charge for ${event.params.minutesCharged} mins`,
    minutesCharged: Number(event.params.minutesCharged),
    timestamp: BigInt(event.block.timestamp),
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transactionHash
  });

  // B. Update Session Totals
  let session = await context.Session.get(sessionId);
  if (session) {
    context.Session.set({
      ...session,
      totalCost: session.totalCost + event.params.chargeAmount
    });
  }

  // C. Update Provider Revenue
  let provider = await context.ServiceProvider.get(event.params.provider.toString());
  if (provider) {
    context.ServiceProvider.set({
      ...provider,
      totalRevenue: provider.totalRevenue + event.params.chargeAmount
    });
  }

  // D. Update Customer Spent
  let customer = await context.Customer.get(event.params.customer.toString());
  if (customer) {
    context.Customer.set({
      ...customer,
      totalSpent: customer.totalSpent + event.params.chargeAmount
    });
  }
});

// 4. SESSION ENDED
FlexPass.SessionEnded.handler(async ({ event, context }) => {
  const sessionId = event.params.sessionId.toString();

  // Close Session
  let session = await context.Session.get(sessionId);
  if (session) {
    context.Session.set({
      ...session,
      endTime: event.params.endTime,
      totalCost: event.params.totalCost, // Final sync
      isActive: false
    });
  }
});

// 5. RECURRING PAYMENTS
FlexPass.RecurringPaymentSetup.handler(async ({ event, context }) => {
  const id = `${event.params.customer}-${event.params.provider}`;
  
  context.RecurringPayment.set({
    id: id,
    customerAddress: event.params.customer.toString(), // Use customerAddress
    providerAddress: event.params.provider.toString(), // Use providerAddress
    amount: event.params.amount,
    interval: event.params.interval,
    isActive: true,
    setupTimestamp: BigInt(event.block.timestamp),
    lastExecuted: null, // Use null instead of 0n
    totalExecutions: 0
  });
});

FlexPass.RecurringPaymentExecuted.handler(async ({ event, context }) => {
  const id = `${event.params.customer}-${event.params.provider}`;
  
  let recurring = await context.RecurringPayment.get(id);
  if (recurring) {
    context.RecurringPayment.set({
      ...recurring,
      lastExecuted: event.params.timestamp,
      totalExecutions: recurring.totalExecutions + 1
    });
  }
});

FlexPass.RecurringPaymentCancelled.handler(async ({ event, context }) => {
  const id = `${event.params.customer}-${event.params.provider}`;
  
  let recurring = await context.RecurringPayment.get(id);
  if (recurring) {
    context.RecurringPayment.set({
      ...recurring,
      isActive: false
    });
  }
});