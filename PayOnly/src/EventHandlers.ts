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
  try {
    console.log(`🔍 SessionStarted event received`);
    
    // Extract parameters with absolute safety
    const sessionId = event.params?.sessionId || '0x0000000000000000000000000000000000000000000000000000000000000000';
    const provider = event.params?.provider || '0x0000000000000000000000000000000000000000';
    const customer = event.params?.customer || '0x0000000000000000000000000000000000000000';
    const startTime = event.params?.startTime || 0n;
    
    console.log(`📋 Extracted params:`, { sessionId, provider, customer, startTime });
    
    // Absolute validation - reject if any are null/undefined/zero
    if (!sessionId || sessionId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      console.error(`❌ ABORT: Invalid sessionId`);
      return;
    }
    
    if (!provider || provider === '0x0000000000000000000000000000000000000000') {
      console.error(`❌ ABORT: Invalid provider`);
      return;
    }
    
    if (!customer || customer === '0x0000000000000000000000000000000000000000') {
      console.error(`❌ ABORT: Invalid customer`);
      return;
    }
    
    if (!startTime || startTime === 0n) {
      console.error(`❌ ABORT: Invalid startTime`);
      return;
    }
    
    console.log(`✅ All parameters validated - proceeding with session creation`);
    
    // Create session with new schema field names
    const sessionData = {
      id: sessionId,
      sessionId: sessionId,
      providerAddress: provider.toLowerCase(), // Changed from 'provider' to 'providerAddress'
      customerAddress: customer.toLowerCase(), // Changed from 'customer' to 'customerAddress'
      serviceType: ServiceType.CUSTOM,
      startTime: startTime,
      endTime: null,
      totalCost: 0n,
      isActive: true
    };
    
    console.log(`🔍 Final session data (new schema):`, sessionData);
    
    // Verify once more that customerAddress is not null
    if (!sessionData.customerAddress) {
      console.error(`❌ CRITICAL: customerAddress is still null after all validation!`);
      return;
    }
    
    console.log(`✅ customerAddress field verified non-null: ${sessionData.customerAddress}`);
    
    // Create the session
    const session = await Session.create(sessionData);
    console.log(`✅ Session created successfully:`, session?.id);
    
    // Try to create/update related entities (non-blocking)
    try {
      await Customer.upsert({
        id: customer.toLowerCase(),
        address: customer.toLowerCase(),
        totalSessions: 1,
        totalSpent: 0n
      });
      console.log(`✅ Customer entity updated`);
    } catch (customerError) {
      console.error(`⚠️ Customer entity update failed (non-critical):`, customerError.message);
    }
    
    try {
      await ServiceProvider.upsert({
        id: provider.toLowerCase(),
        address: provider.toLowerCase(),
        serviceName: "Auto-created Service",
        serviceType: ServiceType.CUSTOM,
        rate: 100000n, // 0.1 USDC per minute
        isActive: true,
        totalSessions: 1,
        totalRevenue: 0n,
        registeredAt: event.block.timestamp,
        updatedAt: event.block.timestamp
      });
      console.log(`✅ ServiceProvider entity updated`);
    } catch (providerError) {
      console.error(`⚠️ ServiceProvider entity update failed (non-critical):`, providerError.message);
    }
    
  } catch (error) {
    console.error(`❌ CRITICAL ERROR in handleSessionStarted:`, error);
    console.error(`❌ Error stack:`, error.stack);
    console.error(`❌ Event data:`, event);
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
  
  // Create payment record with new schema
  const payment = await Payment.create({
    id: `${sessionId}-${event.block.timestamp}`,
    sessionId: sessionId, // Changed from 'session' to 'sessionId'
    amount: chargeAmount,
    reason: `Usage charge for ${minutesCharged} minute(s)`,
    minutesCharged: Number(minutesCharged),
    timestamp: event.block.timestamp,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash
  });
  
  // Update session total cost
  const newTotalCost = session.totalCost + chargeAmount;
  await Session.update({
    id: sessionId,
    totalCost: newTotalCost
  });
  
  // Update provider revenue
  const serviceProvider = await ServiceProvider.get(provider.toLowerCase());
  if (serviceProvider) {
    await ServiceProvider.update({
      id: provider.toLowerCase(),
      totalRevenue: serviceProvider.totalRevenue + chargeAmount,
      updatedAt: event.block.timestamp
    });
  }
  
  // Update customer spending
  const customerEntity = await Customer.get(customer.toLowerCase());
  if (customerEntity) {
    await Customer.update({
      id: customer.toLowerCase(),
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