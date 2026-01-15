/**
 * Load Testing Script
 * Test application under load (100+ concurrent users)
 * Run with: npm run test:load
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 4000,
  concurrent_users: 100,
  duration_seconds: 30,
  requests_per_user: 10,
};

let totalRequests = 0;
let totalErrors = 0;
let totalTime = 0;
let startTime = Date.now();

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
    };

    const requestStart = Date.now();
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        const requestTime = Date.now() - requestStart;
        totalRequests++;
        totalTime += requestTime;

        if (res.statusCode >= 400) {
          totalErrors++;
        }

        resolve({
          status: res.statusCode,
          time: requestTime,
        });
      });
    });

    req.on('error', (error) => {
      totalErrors++;
      totalRequests++;
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runLoadTest() {
  console.log('🚀 Starting Load Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Concurrent Users: ${config.concurrent_users}`);
  console.log(`   - Duration: ${config.duration_seconds}s`);
  console.log(`   - Requests per User: ${config.requests_per_user}`);
  console.log('');

  const users = [];
  for (let i = 0; i < config.concurrent_users; i++) {
    users.push(simulateUser(i));
  }

  await Promise.all(users);

  const duration = (Date.now() - startTime) / 1000;
  const avgResponseTime = (totalTime / totalRequests).toFixed(2);
  const requestsPerSecond = (totalRequests / duration).toFixed(2);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);

  console.log('');
  console.log('📈 Load Test Results:');
  console.log(`   - Total Requests: ${totalRequests}`);
  console.log(`   - Total Errors: ${totalErrors}`);
  console.log(`   - Error Rate: ${errorRate}%`);
  console.log(`   - Total Duration: ${duration.toFixed(2)}s`);
  console.log(`   - Avg Response Time: ${avgResponseTime}ms`);
  console.log(`   - Requests/Second: ${requestsPerSecond}`);
  console.log('');

  if (errorRate > 5) {
    console.log('⚠️  Warning: Error rate exceeds 5%');
    process.exit(1);
  } else {
    console.log('✅ Load test completed successfully');
    process.exit(0);
  }
}

async function simulateUser(userId) {
  const endTime = Date.now() + config.duration_seconds * 1000;

  while (Date.now() < endTime) {
    try {
      // Simulate user login
      await makeRequest(
        '/auth/login',
        'POST',
        {
          email: `user${userId}@example.com`,
          password: 'password',
        }
      );

      // Simulate wedding fetch
      await makeRequest(`/weddings/test-wedding-${userId}`);

      // Simulate guest list fetch
      await makeRequest(`/weddings/test-wedding-${userId}/guests`);

      // Simulate timeline fetch
      await makeRequest(`/weddings/test-wedding-${userId}/timeline`);

      // Simulate chat message send
      await makeRequest(
        `/weddings/test-wedding-${userId}/chat`,
        'POST',
        {
          message: 'Test message from load test',
          type: 'TEXT',
        }
      );

      // Add small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      // Continue on error
    }
  }
}

// Run the load test
runLoadTest().catch((error) => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
