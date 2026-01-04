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
  console.log(`🔍 Raw event received:`, {
    params: event.params,
    block: event.block?.number,
    transaction: event.transaction?.hash
  });
  
  const { sessionId, provider, customer, startTime } = event.params;
  
  console.log(`🚀 Session started event - Raw params:`, {
    sessionId: sessionId,
    provider: provider,
    customer: customer,
    startTime: startTime
  });
  
  // More thorough validation with type checking
  if (!sessionId || sessionId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    console.error(`❌ Invalid sessionId: ${sessionId}`);
    return;
  }
  
  if (!provider || provider === '0x0000000000000000000000000000000000000000') {
    console.error(`❌ Invalid provider: ${provider}`);
    return;
  }
  
  if (!customer || customer === '0x0000000000000000000000000000000000000000') {
    console.error(`❌ Invalid customer: ${customer}`);
    return;
  }
  
  if (!startTime || startTime === 0n) {
    console.error(`❌ Invalid startTime: ${startTime}`);
    return;
  }
  
  console.log(`✅ All parameters validated successfully`);
  
  // Ensure customer exists with additional validation
  let customerEntity;
  try {
    console.log(`🔍 Creating/getting customer entity for: ${customer}`);
    
    customerEntity = await Customer.upsert({
      id: customer.toLowerCase(), // Ensure consistent casing
      address: customer.toLowerCase(),
      totalSessions: 0,
      totalSpent: 0n
    });
    
    console.log(`✅ Customer entity result:`, customerEntity);
    
  } catch (error) {
    console.error(`❌ Error creating customer entity:`, error);
    // Continue anyway - we'll use the address directly
  }
  
  // Get service provider with validation
  let serviceProvider;
  try {
    console.log(`🔍 Getting service provider: ${provider}`);
    serviceProvider = await ServiceProvider.get(provider.toLowerCase());
    
    if (!serviceProvider) {
      console.error(`❌ Service provider not found: ${provider}`);
      // Create a default service provider to avoid blocking
      serviceProvider = await ServiceProvider.create({
        id: provider.toLowerCase(),
        address: provider.toLowerCase(),
        serviceName: "Unknown Service",
        serviceType: ServiceType.CUSTOM,
        rate: 0n,
        isActive: true,
        totalSessions: 0,
        totalRevenue: 0n,
        registeredAt: event.block.timestamp,
        updatedAt: event.block.timestamp
      });
      console.log(`✅ Created default service provider:`, serviceProvider);
    }
    
  } catch (error) {
    console.error(`❌ Error with service provider:`, error);
    return;
  }
  
  // Create session with direct address references instead of entity relationships
  try {
    console.log(`🔍 Creating session with direct address references`);
    
    const sessionData = {
      id: sessionId,
      sessionId: sessionId,
      provider: provider.toLowerCase(), // Use address directly instead of entity reference
      customer: customer.toLowerCase(), // Use address directly instead of entity reference
      serviceType: serviceProvider.serviceType,
      startTime: startTime,
      endTime: null,
      totalCost: 0n,
      isActive: true
    };
    
    console.log(`🔍 Session data to create:`, sessionData);
    
    const session = await Session.create(sessionData);
    
    console.log(`✅ Session created successfully:`, session);
    
    // Update counters if entities exist
    if (serviceProvider) {
      try {
        await ServiceProvider.update({
          id: provider.toLowerCase(),
          totalSessions: serviceProvider.totalSessions + 1,
          updatedAt: event.block.timestamp
        });
      } catch (e) {
        console.error(`❌ Error updating provider stats:`, e);
      }
    }
    
    if (customerEntity) {
      try {
        await Customer.update({
          id: customer.toLowerCase(),
          totalSessions: customerEntity.totalSessions + 1
        });
      } catch (e) {
        console.error(`❌ Error updating customer stats:`, e);
      }
    }
    
    console.log(`✅ Session processing completed successfully`);
    
  } catch (error) {
    console.error(`❌ Error creating session:`, error);
    console.error(`❌ This is the exact error causing the constraint violation`);
    
    // Try alternative approach - create session with minimal required fields
    try {
      console.log(`🔄 Attempting minimal session creation`);
      const minimalSession = await Session.create({
        id: sessionId,
        sessionId: sessionId,
        provider: provider.toLowerCase(),
        customer: customer.toLowerCase(),
        serviceType: ServiceType.CUSTOM,
        startTime: startTime,
        totalCost: 0n,
        isActive: true
      });
      console.log(`✅ Minimal session created:`, minimalSession);
    } catch (minimalError) {
      console.error(`❌ Even minimal session creation failed:`, minimalError);
    }
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