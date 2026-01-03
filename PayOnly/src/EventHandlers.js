/*
 * FLEXPASS EVENT HANDLERS
 * * Note: Envio uses a specific "context" API.
 * We use 'context.Entity.get(id)' to read and 'context.Entity.set(obj)' to write.
 */

const { FlexPass } = require("generated");

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
  const sessionId = event.params.sessionId.toString();
  const providerId = event.params.provider.toString();
  const customerId = event.params.customer.toString();

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

  // C. Create Session
  context.Session.set({
    id: sessionId,
    sessionId: sessionId,
    provider_id: providerId, // Note: Use snake_case '_id' for relations if defined in schema
    customer_id: customerId,
    serviceType: provider ? provider.serviceType : "UNKNOWN",
    startTime: event.params.startTime,
    endTime: 0n, // Placeholder for null
    totalCost: 0n,
    isActive: true
  });
});

// 3. SESSION CHARGED
FlexPass.SessionCharged.handler(async ({ event, context }) => {
  const sessionId = event.params.sessionId.toString();
  const paymentId = `${event.transactionHash}-${event.logIndex}`;

  // A. Record Payment
  context.Payment.set({
    id: paymentId,
    session_id: sessionId,
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
    customer: event.params.customer.toString(),
    provider: event.params.provider.toString(),
    amount: event.params.amount,
    interval: event.params.interval,
    isActive: true,
    setupTimestamp: BigInt(event.block.timestamp),
    lastExecuted: 0n,
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