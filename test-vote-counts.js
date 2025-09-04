// Test to verify vote count consistency between dashboard and individual polls
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

async function testVoteCountConsistency() {
  try {
    console.log('=== Testing Vote Count Consistency ===');
    console.log('\nThis test verifies that vote counts match between:');
    console.log('1. Dashboard API (polls list)');
    console.log('2. Individual poll API');
    
    // Step 1: Get polls from dashboard API
    console.log('\n📊 Step 1: Getting polls from dashboard API...');
    
    // Create mock session for authentication
    const mockSessionData = {
      user: {
        id: 'demo-user-1',
        email: 'demo@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    const mockSessionCookie = 'mock-auth-session=' + encodeURIComponent(JSON.stringify(mockSessionData));
    
    const dashboardResponse = await makeRequest('http://localhost:3000/api/polls?userId=demo-user-1', {
      headers: {
        'Cookie': mockSessionCookie
      }
    });
    
    if (dashboardResponse.status !== 200) {
      console.log('❌ Failed to get dashboard data:', dashboardResponse.status);
      return;
    }
    
    const dashboardData = JSON.parse(dashboardResponse.data);
    const polls = dashboardData.data || [];
    
    console.log('✅ Found', polls.length, 'polls in dashboard');
    
    // Step 2: Check each poll individually
    console.log('\n🔍 Step 2: Checking individual polls...');
    
    for (const poll of polls.slice(0, 3)) { // Test first 3 polls
      console.log(`\n--- Testing Poll: ${poll.title} (${poll.id}) ---`);
      
      // Get dashboard vote count
      const dashboardVoteCount = poll.total_votes || 0;
      console.log('Dashboard total votes:', dashboardVoteCount);
      
      // Get individual poll data
      const individualResponse = await makeRequest(`http://localhost:3000/api/polls/${poll.id}`);
      
      if (individualResponse.status !== 200) {
        console.log('❌ Failed to get individual poll data:', individualResponse.status);
        continue;
      }
      
      const individualData = JSON.parse(individualResponse.data);
      const individualPoll = individualData.data;
      
      const individualVoteCount = individualPoll.total_votes || 0;
      console.log('Individual poll total votes:', individualVoteCount);
      
      // Compare vote counts
      if (dashboardVoteCount === individualVoteCount) {
        console.log('✅ Vote counts match!');
      } else {
        console.log('❌ Vote count mismatch!');
        console.log('   Dashboard:', dashboardVoteCount);
        console.log('   Individual:', individualVoteCount);
      }
      
      // Check option-level vote counts
      console.log('\nOption-level comparison:');
      for (const option of poll.options || []) {
        const dashboardOptionVotes = option.vote_count || 0;
        const individualOption = individualPoll.options.find(opt => opt.id === option.id);
        const individualOptionVotes = individualOption?.vote_count || 0;
        
        console.log(`  ${option.text}: Dashboard=${dashboardOptionVotes}, Individual=${individualOptionVotes}`);
        
        if (dashboardOptionVotes !== individualOptionVotes) {
          console.log('    ❌ Option vote count mismatch!');
        }
      }
    }
    
    console.log('\n🎉 Vote count consistency test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVoteCountConsistency();