const { assignOperatorRoundRobin } = require('./src/services/roundRobinService');
const pool = require('./src/db');

async function runRoundRobinTests() {
  console.log('\n========================================================');
  console.log('⚡ STARTING ROUND-ROBIN OPERATOR ROUTING TESTS');
  console.log('========================================================\n');

  const tenantPk = 'org-pk-karachi-001';
  const tenantAe = 'org-ae-dubai-001';

  // Clear orders first for clean state
  pool._tables.orders.length = 0;

  console.log('--- TEST 1: Initial Allocation (No existing assignments) ---');
  console.log('Expectation: Allocation to user-op-pk-1 (since created earlier than user-op-pk-2)');
  let operatorId = await assignOperatorRoundRobin(tenantPk);
  console.log(`Assigned Operator: ${operatorId}`);
  if (operatorId === 'user-op-pk-1') {
    console.log('✅ PASS\n');
  } else {
    console.error(`❌ FAIL: Expected user-op-pk-1, got ${operatorId}\n`);
    process.exit(1);
  }

  console.log('--- TEST 2: Allocate after Operator 1 receives an assignment ---');
  // Simulate order assignment to user-op-pk-1
  pool._tables.orders.push({
    id: 'order-1',
    organization_id: tenantPk,
    created_by_user_id: 'user-op-pk-1',
    created_at: new Date().toISOString()
  });

  console.log('Expectation: Allocation to user-op-pk-2 (has 0 active assignments vs user-op-pk-1\'s 1)');
  operatorId = await assignOperatorRoundRobin(tenantPk);
  console.log(`Assigned Operator: ${operatorId}`);
  if (operatorId === 'user-op-pk-2') {
    console.log('✅ PASS\n');
  } else {
    console.error(`❌ FAIL: Expected user-op-pk-2, got ${operatorId}\n`);
    process.exit(1);
  }

  console.log('--- TEST 3: Equal assignments sorting by created_at ---');
  // Simulate order assignment to user-op-pk-2
  pool._tables.orders.push({
    id: 'order-2',
    organization_id: tenantPk,
    created_by_user_id: 'user-op-pk-2',
    created_at: new Date().toISOString()
  });

  console.log('Expectation: Allocation back to user-op-pk-1 (both have 1 assignment, op-pk-1 created earlier)');
  operatorId = await assignOperatorRoundRobin(tenantPk);
  console.log(`Assigned Operator: ${operatorId}`);
  if (operatorId === 'user-op-pk-1') {
    console.log('✅ PASS\n');
  } else {
    console.error(`❌ FAIL: Expected user-op-pk-1, got ${operatorId}\n`);
    process.exit(1);
  }

  console.log('--- TEST 4: Tenant Isolation ---');
  console.log('Expectation: Dubai tenant should allocate to user-op-ae-1');
  operatorId = await assignOperatorRoundRobin(tenantAe);
  console.log(`Assigned Operator: ${operatorId}`);
  if (operatorId === 'user-op-ae-1') {
    console.log('✅ PASS\n');
  } else {
    console.error(`❌ FAIL: Expected user-op-ae-1, got ${operatorId}\n`);
    process.exit(1);
  }

  console.log('--- TEST 5: Fallback to null when no online operators exist ---');
  console.log('Expectation: A tenant with no operators or online status should return null');
  operatorId = await assignOperatorRoundRobin('org-unknown-tenant');
  console.log(`Assigned Operator: ${operatorId}`);
  if (operatorId === null) {
    console.log('✅ PASS\n');
  } else {
    console.error(`❌ FAIL: Expected null, got ${operatorId}\n`);
    process.exit(1);
  }

  console.log('========================================================');
  console.log('🎉 ALL ROUND-ROBIN ROUTING TESTS PASSED');
  console.log('========================================================\n');
}

runRoundRobinTests().catch(err => {
  console.error('Fatal Test Exception:', err);
  process.exit(1);
});
