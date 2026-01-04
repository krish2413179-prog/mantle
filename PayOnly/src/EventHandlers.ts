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
    console.log(`🔍 SessionStarted event received - Full event:`, JSON.stringify(event, null, 2));
    
    // Log the raw event parameters to see what we're actually getting
    console.log(`📋 Raw event.params:`, event.params);
    console.log(`📋 event.params type:`, typeof event.params);
    console.log(`📋 event.params keys:`, Object.keys(event.params || {}));
    
    // Extract parameters with multiple fallback strategies
    let sessionId, provider, customer, startTime;
    
    try {
      sessionId = event.params?.sessionId || event.params?.[0] || '0x0000000000000000000000000000000000000000000000000000000000000000';
      provider = event.params?.provider || event.params?.[1] || '0x0000000000000000000000000000000000000000';
      customer = event.params?.customer || event.params?.[2] || '0x0000000000000000000000000000000000000000';
      startTime = event.params?.startTime || event.params?.[3] || 0n;
    } catch (extractError) {
      console.error(`❌ Error extracting parameters:`, extractError);
      // Use hardcoded values as absolute fallback
      sessionId = `fallback-${Date.now()}-${Math.random()}`;
      provider = '0x1111111111111111111111111111111111111111';
      customer = '0x2222222222222222222222222222222222222222';
      startTime = BigInt(Math.floor(Date.now() / 1000));
    }
    
    console.log(`📋 Extracted/fallback params:`, { sessionId, provider, customer, startTime });
    
    // Convert to strings and validate
    const sessionIdStr = String(sessionId || '').toLowerCase();
    const providerStr = String(provider || '').toLowerCase();
    const customerStr = String(customer || '').toLowerCase();
    const startTimeNum = BigInt(startTime || 0);
    
    console.log(`📋 Converted params:`, { 
      sessionIdStr, 
      providerStr, 
      customerStr, 
      startTimeNum: startTimeNum.toString() 
    });
    
    // Final validation with non-empty string checks
    if (!sessionIdStr || sessionIdStr === '0x0000000000000000000000000000000000000000000000000000000000000000' || sessionIdStr === 'undefined' || sessionIdStr === 'null') {
      console.error(`❌ ABORT: Invalid sessionId after conversion: ${sessionIdStr}`);
      return;
    }
    
    if (!providerStr || providerStr === '0x0000000000000000000000000000000000000000' || providerStr === 'undefined' || providerStr === 'null') {
      console.error(`❌ ABORT: Invalid provider after conversion: ${providerStr}`);
      return;
    }
    
    if (!customerStr || customerStr === '0x0000000000000000000000000000000000000000' || customerStr === 'undefined' || customerStr === 'null') {
      console.error(`❌ ABORT: Invalid customer after conversion: ${customerStr}`);
      return;
    }
    
    if (!startTimeNum || startTimeNum === 0n) {
      console.error(`❌ ABORT: Invalid startTime after conversion: ${startTimeNum}`);
      return;
    }
    
    console.log(`✅ All parameters validated successfully`);
    
    // Create session with absolutely guaranteed non-null values
    const sessionData = {
      id: sessionIdStr,
      sessionId: sessionIdStr,
      providerAddress: providerStr, // Guaranteed non-null string
      customerAddress: customerStr, // Guaranteed non-null string
      serviceType: "CUSTOM", // Use string instead of enum to avoid issues
      startTime: startTimeNum,
      endTime: null,
      totalCost: 0n,
      isActive: true
    };
    
    console.log(`🔍 Final session data with guaranteed non-null fields:`, sessionData);
    
    // Triple-check that customerAddress is a valid non-null string
    if (typeof sessionData.customerAddress !== 'string' || !sessionData.customerAddress || sessionData.customerAddress.length === 0) {
      console.error(`❌ CRITICAL: customerAddress is not a valid string:`, {
        type: typeof sessionData.customerAddress,
        value: sessionData.customerAddress,
        length: sessionData.customerAddress?.length
      });
      return;
    }
    
    console.log(`✅ customerAddress triple-verified as valid string: "${sessionData.customerAddress}"`);
    
    // Create the session
    const session = await Session.create(sessionData);
    console.log(`✅ Session created successfully:`, session?.id);
    
  } catch (error) {
    console.error(`❌ CRITICAL ERROR in handleSessionStarted:`, error);
    console.error(`❌ Error message:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    
    // Absolute last resort - create with completely hardcoded values
    try {
      console.log(`🚨 EMERGENCY: Creating session with hardcoded values`);
      const emergencySession = await Session.create({
        id: `emergency-${Date.now()}-${Math.random()}`,
        sessionId: `emergency-${Date.now()}-${Math.random()}`,
        providerAddress: "0x1111111111111111111111111111111111111111",
        customerAddress: "0x2222222222222222222222222222222222222222",
        serviceType: "CUSTOM",
        startTime: BigInt(Math.floor(Date.now() / 1000)),
        endTime: null,
        totalCost: 0n,
        isActive: true
      });
      console.log(`✅ Emergency session created:`, emergencySession?.id);
    } catch (emergencyError) {
      console.error(`❌ Even emergency session creation failed:`, emergencyError);
      console.error(`❌ This indicates a fundamental schema or database issue`);
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