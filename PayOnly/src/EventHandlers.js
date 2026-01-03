// FlexPass Event Handlers - JavaScript Version

// Handle ServiceRegistered events
const handleServiceRegistered = async (event) => {
  const { provider, name, rate, serviceType } = event.params;
  
  console.log(`📝 Service registered: ${name} by ${provider}`);
  
  // Create or update service provider
  const serviceProvider = {
    id: provider,
    address: provider,
    serviceName: name,
    serviceType: getServiceType(serviceType),
    rate: rate,
    isActive: true,
    totalSessions: 0,
    totalRevenue: BigInt(0),
    registeredAt: event.block.timestamp,
    updatedAt: event.block.timestamp
  };
  
  // Store service provider (implementation depends on Envio's entity system)
  await ServiceProvider.upsert(serviceProvider);
  
  console.log(`✅ Service provider created/updated: ${serviceProvider.id}`);
};

// Handle SessionStarted events
const handleSessionStarted = async (event) => {
  const { sessionId, provider, customer, startTime } = event.params;
  
  console.log(`🚀 Session started: ${sessionId} between ${provider} and ${customer}`);
  
  // Ensure customer exists
  const customerEntity = {
    id: customer,
    address: customer,
    totalSessions: 0,
    totalSpent: BigInt(0)
  };
  
  await Customer.upsert(customerEntity);
  
  // Get service provider
  const serviceProvider = await ServiceProvider.get(provider);
  if (!serviceProvider) {
    console.error(`❌ Service provider not found: ${provider}`);
    return;
  }
  
  // Create session
  const session = {
    id: sessionId,
    sessionId: sessionId,
    provider: serviceProvider.id,
    customer: customerEntity.id,
    serviceType: serviceProvider.serviceType,
    startTime: startTime,
    endTime: null,
    totalCost: BigInt(0),
    isActive: true
  };
  
  await Session.create(session);
  
  // Update counters
  await ServiceProvider.update({
    id: provider,
    totalSessions: serviceProvider.totalSessions + 1,
    updatedAt: event.block.timestamp
  });
  
  await Customer.update({
    id: customer,
    totalSessions: customerEntity.totalSessions + 1
  });
  
  console.log(`✅ Session created: ${session.id}`);
};

// Handle SessionCharged events
const handleSessionCharged = async (event) => {
  const { sessionId, provider, customer, chargeAmount, minutesCharged } = event.params;
  
  console.log(`💰 Session charged: ${sessionId} - ${chargeAmount} for ${minutesCharged} minutes`);
  
  // Get session
  const session = await Session.get(sessionId);
  if (!session) {
    console.error(`❌ Session not found: ${sessionId}`);
    return;
  }
  
  // Create payment record
  const payment = {
    id: `${sessionId}-${event.block.timestamp}`,
    session: session.id,
    amount: chargeAmount,
    reason: `Usage charge for ${minutesCharged} minute(s)`,
    minutesCharged: Number(minutesCharged),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash
  };
  
  await Payment.create(payment);
  
  // Update session total cost
  const newTotalCost = session.totalCost + chargeAmount;
  await Session.update({
    id: sessionId,
    totalCost: newTotalCost
  });
  
  // Update provider revenue
  const serviceProvider = await ServiceProvider.get(provider);
  if (serviceProvider) {
    await ServiceProvider.update({
      id: provider,
      totalRevenue: serviceProvider.totalRevenue + chargeAmount,
      updatedAt: event.block.timestamp
    });
  }
  
  // Update customer spending
  const customerEntity = await Customer.get(customer);
  if (customerEntity) {
    await Customer.update({
      id: customer,
      totalSpent: customerEntity.totalSpent + chargeAmount
    });
  }
  
  console.log(`✅ Payment recorded: ${payment.id}`);
};

// Handle SessionEnded events
const handleSessionEnded = async (event) => {
  const { sessionId, provider, customer, endTime, totalCost } = event.params;
  
  console.log(`🏁 Session ended: ${sessionId} - Total cost: ${totalCost}`);
  
  // Update session
  const session = await Session.update({
    id: sessionId,
    endTime: endTime,
    totalCost: totalCost,
    isActive: false
  });
  
  if (!session) {
    console.error(`❌ Session not found for update: ${sessionId}`);
    return;
  }
  
  // Update provider stats
  const serviceProvider = await ServiceProvider.get(provider);
  if (serviceProvider) {
    await ServiceProvider.update({
      id: provider,
      totalRevenue: serviceProvider.totalRevenue + totalCost,
      updatedAt: event.block.timestamp
    });
  }
  
  // Update customer stats
  const customerEntity = await Customer.get(customer);
  if (customerEntity) {
    await Customer.update({
      id: customer,
      totalSpent: customerEntity.totalSpent + totalCost
    });
  }
  
  console.log(`✅ Session ended: ${session.id}`);
};

// Handle RecurringPaymentSetup events
const handleRecurringPaymentSetup = async (event) => {
  const { customer, provider, amount, interval } = event.params;
  
  console.log(`🔄 Recurring payment setup: ${customer} -> ${provider}, ${amount} every ${interval}s`);
  
  const recurringPayment = {
    id: `${customer}-${provider}`,
    customer: customer,
    provider: provider,
    amount: amount,
    interval: interval,
    isActive: true,
    setupTimestamp: event.block.timestamp,
    lastExecuted: null,
    totalExecutions: 0
  };
  
  await RecurringPayment.upsert(recurringPayment);
  
  console.log(`✅ Recurring payment setup: ${recurringPayment.id}`);
};

// Handle RecurringPaymentExecuted events
const handleRecurringPaymentExecuted = async (event) => {
  const { customer, provider, amount, timestamp } = event.params;
  
  console.log(`💳 Recurring payment executed: ${customer} -> ${provider}, ${amount}`);
  
  const recurringPaymentId = `${customer}-${provider}`;
  const recurringPayment = await RecurringPayment.get(recurringPaymentId);
  
  if (recurringPayment) {
    await RecurringPayment.update({
      id: recurringPaymentId,
      lastExecuted: timestamp,
      totalExecutions: recurringPayment.totalExecutions + 1
    });
  }
  
  console.log(`✅ Recurring payment executed: ${recurringPaymentId}`);
};

// Handle RecurringPaymentCancelled events
const handleRecurringPaymentCancelled = async (event) => {
  const { customer, provider } = event.params;
  
  console.log(`❌ Recurring payment cancelled: ${customer} -> ${provider}`);
  
  const recurringPaymentId = `${customer}-${provider}`;
  await RecurringPayment.update({
    id: recurringPaymentId,
    isActive: false
  });
  
  console.log(`✅ Recurring payment cancelled: ${recurringPaymentId}`);
};

// Helper function to convert service type enum
function getServiceType(serviceType) {
  switch (Number(serviceType)) {
    case 0: return 'GYM';
    case 1: return 'WIFI';
    case 2: return 'POWER';
    case 3: return 'CUSTOM';
    default: return 'CUSTOM';
  }
}

// Export handlers with Envio naming convention
module.exports = {
  FlexPass: {
    ServiceRegistered: handleServiceRegistered,
    SessionStarted: handleSessionStarted,
    SessionCharged: handleSessionCharged,
    SessionEnded: handleSessionEnded,
    RecurringPaymentSetup: handleRecurringPaymentSetup,
    RecurringPaymentExecuted: handleRecurringPaymentExecuted,
    RecurringPaymentCancelled: handleRecurringPaymentCancelled
  }
};