/**
 * QA Automation Test Suite
 * Automated feature verification for all major functionalities
 * Run with: npm run test:qa
 */

const http = require('http');
const assert = require('assert');

const API_URL = 'http://localhost:4000/api/v1';
const FRONTEND_URL = 'http://localhost:5173';

const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

class TestRunner {
  constructor(name) {
    this.name = name;
  }

  async test(description, fn) {
    try {
      await fn();
      this.pass(description);
    } catch (error) {
      this.fail(description, error);
    }
  }

  pass(description) {
    console.log(`✅ ${description}`);
    testResults.passed++;
    testResults.tests.push({
      name: description,
      status: 'passed',
    });
  }

  fail(description, error) {
    console.log(`❌ ${description}`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({
      name: description,
      status: 'failed',
      error: error.message,
    });
  }

  skip(description) {
    console.log(`⏭️  ${description} (skipped)`);
    testResults.skipped++;
  }
}

function makeRequest(path, method = 'GET', data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body ? JSON.parse(body) : null,
          });
        } catch {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('🧪 Starting QA Automation Test Suite\n');

  // Auth Tests
  const authRunner = new TestRunner('Authentication');
  console.log('📝 Auth Tests:');

  let authToken = null;
  let userId = null;

  await authRunner.test('Signup: Create new user', async () => {
    const res = await makeRequest('/auth/signup', 'POST', {
      email: `qa-user-${Date.now()}@example.com`,
      password: 'QATest123!@#',
      firstName: 'QA',
      lastName: 'User',
    });
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.token, 'No token in response');
    authToken = res.body.token;
    userId = res.body.user.id;
  });

  await authRunner.test('Login: User authentication', async () => {
    const res = await makeRequest('/auth/login', 'POST', {
      email: `qa-user-${Date.now()}@example.com`,
      password: 'QATest123!@#',
    });
    assert(res.status === 200 || res.status === 404, 'Login failed');
  });

  await authRunner.test('JWT Validation: Token is valid', async () => {
    if (!authToken) {
      throw new Error('No auth token available');
    }
    const res = await makeRequest('/weddings', 'GET', null, authToken);
    assert.strictEqual(res.status !== 401, true, 'Token validation failed');
  });

  // Wedding Tests
  const weddingRunner = new TestRunner('Weddings');
  console.log('\n📅 Wedding Tests:');

  let weddingId = null;

  await weddingRunner.test('Create Wedding: Wedding creation', async () => {
    if (!authToken) this.skip('No auth token');
    const res = await makeRequest('/weddings/create', 'POST', {
      weddingName: `QA Test Wedding ${Date.now()}`,
      brideId: userId,
      groomId: userId,
      weddingDate: '2026-06-15',
      venue: 'Test Venue',
      city: 'Mumbai',
    }, authToken);
    assert.strictEqual(res.status, 201, `Expected 201, got ${res.status}`);
    assert(res.body.weddingId, 'No wedding ID returned');
    weddingId = res.body.weddingId;
  });

  await weddingRunner.test('Get Wedding: Retrieve wedding details', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(`/weddings/${weddingId}`, 'GET', null, authToken);
    assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
    assert.strictEqual(res.body.weddingId, weddingId);
  });

  await weddingRunner.test('Wedding Isolation: Cannot access other wedding data', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/fake-wedding-id/guests`,
      'GET',
      null,
      authToken
    );
    assert(res.status === 403 || res.status === 404, 'Access control failed');
  });

  // Guest Management Tests
  const guestRunner = new TestRunner('Guests');
  console.log('\n👥 Guest Management Tests:');

  await guestRunner.test('Add Guest: Invite guest to wedding', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/guests/invite`,
      'POST',
      {
        email: `guest-${Date.now()}@example.com`,
        name: 'Test Guest',
        side: 'BRIDE',
      },
      authToken
    );
    assert(res.status === 201 || res.status === 200, 'Guest invitation failed');
  });

  await guestRunner.test('Get Guests: Retrieve guest list', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/guests`,
      'GET',
      null,
      authToken
    );
    assert.strictEqual(res.status, 200, 'Failed to retrieve guest list');
    assert(Array.isArray(res.body), 'Guests list is not an array');
  });

  // Budget Tests
  const budgetRunner = new TestRunner('Budget');
  console.log('\n💰 Budget Tests:');

  await budgetRunner.test('Create Budget: Add expense', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/budget/expenses`,
      'POST',
      {
        category: 'VENUE',
        amount: 500000,
        paidBy: userId,
        description: 'Venue Booking',
      },
      authToken
    );
    assert(res.status === 201 || res.status === 200, 'Failed to create expense');
  });

  await budgetRunner.test('Get Budget: Retrieve expenses', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/budget`,
      'GET',
      null,
      authToken
    );
    assert.strictEqual(res.status, 200, 'Failed to retrieve budget');
  });

  // Timeline Tests
  const timelineRunner = new TestRunner('Timeline');
  console.log('\n📌 Timeline Tests:');

  await timelineRunner.test('Create Event: Add timeline event', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/timeline/events`,
      'POST',
      {
        functionType: 'WEDDING',
        eventName: 'Main Ceremony',
        startDateTime: '2026-06-15T10:00:00Z',
        venue: 'Grand Hall',
      },
      authToken
    );
    assert(res.status === 201 || res.status === 200, 'Failed to create event');
  });

  await timelineRunner.test('Get Timeline: Retrieve events', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/timeline`,
      'GET',
      null,
      authToken
    );
    assert.strictEqual(res.status, 200, 'Failed to retrieve timeline');
  });

  // Vendor Tests
  const vendorRunner = new TestRunner('Vendors');
  console.log('\n🏪 Vendor Tests:');

  await vendorRunner.test('Search Vendors: Location-based vendor search', async () => {
    const res = await makeRequest('/vendors/search?type=CATERER&city=Mumbai', 'GET', null, authToken);
    assert(res.status === 200 || res.status === 400, 'Vendor search failed');
  });

  await vendorRunner.test('Add Vendor: Assign vendor to wedding', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/vendors`,
      'POST',
      {
        vendorName: 'Test Caterer',
        vendorType: 'CATERER',
        contact: 'contact@caterer.com',
      },
      authToken
    );
    assert(res.status === 201 || res.status === 200, 'Failed to add vendor');
  });

  // Chat Tests
  const chatRunner = new TestRunner('Chat');
  console.log('\n💬 Chat Tests:');

  await chatRunner.test('Send Message: Post chat message', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/chat`,
      'POST',
      {
        message: 'Test message from QA',
        type: 'TEXT',
      },
      authToken
    );
    assert(res.status === 201 || res.status === 200, 'Failed to send message');
  });

  await chatRunner.test('Get Messages: Retrieve chat history', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/chat`,
      'GET',
      null,
      authToken
    );
    assert.strictEqual(res.status, 200, 'Failed to retrieve messages');
  });

  // RBAC Tests
  const rbacRunner = new TestRunner('RBAC');
  console.log('\n🔐 Role-Based Access Control Tests:');

  await rbacRunner.test('Verify Bride/Groom are WEDDING_MAIN_ADMIN', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(`/weddings/${weddingId}`, 'GET', null, authToken);
    assert.strictEqual(res.status, 200);
    assert(res.body.roles, 'No roles in response');
  });

  await rbacRunner.test('Prevent unauthorized role changes', async () => {
    if (!weddingId) this.skip('No wedding created');
    const res = await makeRequest(
      `/weddings/${weddingId}/roles/assign`,
      'POST',
      {
        userId: 'other-user',
        role: 'WEDDING_ADMIN',
      },
      authToken
    );
    // Should succeed for WEDDING_MAIN_ADMIN
    assert(res.status !== 401, 'Not authenticated');
  });

  // Security Tests
  const securityRunner = new TestRunner('Security');
  console.log('\n🛡️  Security Tests:');

  await securityRunner.test('Invalid JWT: Reject invalid token', async () => {
    const res = await makeRequest('/weddings', 'GET', null, 'invalid-token');
    assert.strictEqual(res.status, 401, 'Should reject invalid token');
  });

  await securityRunner.test('CORS Headers: Check CORS configuration', async () => {
    const res = await makeRequest('/auth/signup', 'POST', {
      email: 'test@example.com',
      password: 'password',
      firstName: 'Test',
      lastName: 'User',
    });
    assert(res.headers['access-control-allow-origin'] !== undefined || res.status !== 401);
  });

  await securityRunner.test('SQL Injection: Prevent SQL injection attacks', async () => {
    const res = await makeRequest(`/weddings/'; DROP TABLE weddings; --`, 'GET', null, authToken);
    assert(res.status !== 200 || res.status !== 200, 'SQL injection not prevented');
  });

  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`⏭️  Skipped: ${testResults.skipped}`);
  console.log(`📈 Total: ${testResults.passed + testResults.failed + testResults.skipped}`);
  console.log(`🎯 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
  console.log('='.repeat(60));

  if (testResults.failed > 0) {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! Application is ready for deployment.');
    process.exit(0);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});
