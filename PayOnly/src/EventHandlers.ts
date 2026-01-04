import {
  ServiceRegisteredEvent,
  SessionStartedEvent,
  SessionChargedEvent,
  SessionEndedEvent,
  ServiceProvider,
  Customer,
  Session,
  Payment,
  SessionCondition,
  ServiceType
} from "generated";

// Handle ServiceRegistered events
export const handleServiceRegistered = async (event: ServiceRegisteredEvent) => {
  const { provider, name, rate, serviceType } = event.params;
  
  console.log(`📝 Service registered: ${name} by ${provider}`);
  
  // Create or update service provider
  const serviceProvider = await ServiceProvider.upsert({
    id: provider,
    address: provider,
    serviceName: name,
    serviceType: getServiceType(serviceType),
    rate: rate,
    isActive: true,
    totalSessions: 0,
    totalRevenue: 0n,
    registeredAt: event.block.timestamp,
    updatedAt: event.block.timestamp
  });
  
  console.log(`✅ Service provider created/updated: ${serviceProvider.id}`);
};

// Handle SessionStarted events
export const handleSessionStarted = async (event: SessionStartedEvent) => {
  const { sessionId, provider, customer, startTime } = event.params;
  
  console.log(`🚀 Session started: ${sessionId} between ${provider} and ${customer}`);
  
  // Validate required parameters
  if (!sessionId || !provider || !customer || !startTime) {
    console.error(`❌ Missing required parameters:`, {
      sessionId: sessionId || 'MISSING',
      provider: provider || 'MISSING', 
      customer: customer || 'MISSING',
      startTime: startTime || 'MISSING'
    });
    return;
  }
  
  // Ensure customer exists
  let customerEntity;
  try {
    customerEntity = await Customer.upsert({
      id: customer,
      address: customer,
      totalSessions: 0,
      totalSpent: 0n
    });
    
    if (!customerEntity || !customerEntity.id) {
      console.error(`❌ Failed to create/get customer entity for: ${customer}`);
      return;
    }
  } catch (error) {
    console.error(`❌ Error creating customer entity:`, error);
    return;
  }
  
  // Get service provider
  const serviceProvider = await ServiceProvider.get(provider);
  if (!serviceProvider) {
    console.error(`❌ Service provider not found: ${provider}`);
    return;
  }
  
  // Create session with explicit null checks
  try {
    const session = await Session.create({
      id: sessionId,
      sessionId: sessionId,
      provider: serviceProvider.id,
      customer: customerEntity.id, // This should now be guaranteed to be non-null
      serviceType: serviceProvider.serviceType,
      startTime: startTime,
      endTime: null,
      totalCost: 0n,
      isActive: true
    });
    
    console.log(`✅ Session created successfully: ${session.id}`);
    
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
    
  } catch (error) {
    console.error(`❌ Error creating session:`, error);
    console.error(`Session data:`, {
      id: sessionId,
      sessionId: sessionId,
      provider: serviceProvider.id,
      customer: customerEntity.id,
      serviceType: serviceProvider.serviceType,
      startTime: startTime
    });
  }
};

// Handle SessionCharged events
export const handleSessionCharged = async (event: SessionChargedEvent) => {
  const { sessionId, provider, customer, chargeAmount, minutesCharged } = event.params;
  
  console.log(`💰 Session charged: ${sessionId} - ${chargeAmount} for ${minutesCharged} minutes`);
  
  // Get session
  const session = await Session.get(sessionId);
  if (!session) {
    console.error(`❌ Session not found: ${sessionId}`);
    return;
  }
  
  // Create payment record
  const payment = await Payment.create({
    id: `${sessionId}-${event.block.timestamp}`,
    session: session.id,
    amount: chargeAmount,
    reason: `Usage charge for ${minutesCharged} minute(s)`,
    minutesCharged: Number(minutesCharged),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
    conditions: {
      wifiConnected: null,
      locationInRange: null,
      batteryCharging: null,
      signalStrength: null,
      distance: null
    }
  });
  
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
export const handleSessionEnded = async (event: SessionEndedEvent) => {
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

// Helper function to convert service type enum
function getServiceType(serviceType: number): ServiceType {
  switch (serviceType) {
    case 0: return ServiceType.GYM;
    case 1: return ServiceType.WIFI;
    case 2: return ServiceType.POWER;
    case 3: return ServiceType.CUSTOM;
    default: return ServiceType.CUSTOM;
  }
}

// Custom handler for logging payment conditions (called from frontend)
export const logPaymentConditions = async (
  sessionId: string,
  conditions: {
    wifiConnected?: boolean;
    locationInRange?: boolean;
    batteryCharging?: boolean;
    signalStrength?: number;
    distance?: number;
  },
  timestamp: number
) => {
  console.log(`📊 Logging payment conditions for session: ${sessionId}`);
  
  // Create session condition records
  const conditionEntries = Object.entries(conditions).map(([key, value]) => ({
    id: `${sessionId}-${key}-${timestamp}`,
    session: sessionId,
    conditionType: key,
    value: String(value),
    timestamp: BigInt(timestamp)
  }));
  
  for (const condition of conditionEntries) {
    await SessionCondition.create(condition);
  }
  
  console.log(`✅ Logged ${conditionEntries.length} conditions for session ${sessionId}`);
};