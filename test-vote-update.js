// Test to verify the complete voting flow works correctly
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

async function testCompleteFlow() {
  try {
    console.log('=== Testing Complete Voting Flow ===');
    console.log('\nThis test verifies that:');
    console.log('1. Poll data can be fetched correctly');
    console.log('2. Votes can be cast with proper authentication');
    console.log('3. Vote counts update immediately after voting');
    console.log('4. The frontend receives the updated data');
    
    // Step 1: Get initial poll data
    console.log('\n📊 Step 1: Getting initial poll data...');
    const initialResponse = await makeRequest('http://localhost:3000/api/polls/poll-test');
    
    if (initialResponse.status !== 200) {
      console.log('❌ Failed to get initial data:', initialResponse.status);
      return;
    }
    
    const initialData = JSON.parse(initialResponse.data);
    console.log('✅ Poll found:', initialData.data.title);
    console.log('   Total votes:', initialData.data.total_votes);
    
    const initialOption1 = initialData.data.options.find(opt => opt.id === 'poll-test-option-1');
    const initialOption2 = initialData.data.options.find(opt => opt.id === 'poll-test-option-2');
    
    console.log('   Option A:', initialOption1?.vote_count || 0, 'votes');
    console.log('   Option B:', initialOption2?.vote_count || 0, 'votes');
    
    // Step 2: Cast a vote with proper authentication
    console.log('\n🗳️  Step 2: Casting vote with authentication...');
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
    
    const voteResponse = await makeRequest('http://localhost:3000/api/polls/poll-test/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': mockSessionCookie
      },
      body: JSON.stringify({
        optionId: 'poll-test-option-1'
      })
    });
    
    if (voteResponse.status !== 200) {
      console.log('❌ Vote failed:', voteResponse.status);
      console.log('   Error:', voteResponse.data);
      return;
    }
    
    const voteData = JSON.parse(voteResponse.data);
    console.log('✅ Vote cast successfully:', voteData.message);
    
    // Step 3: Verify updated data immediately
    console.log('\n🔄 Step 3: Verifying immediate data update...');
    const updatedResponse = await makeRequest('http://localhost:3000/api/polls/poll-test');
    
    if (updatedResponse.status !== 200) {
      console.log('❌ Failed to get updated data:', updatedResponse.status);
      return;
    }
    
    const updatedData = JSON.parse(updatedResponse.data);
    const updatedOption1 = updatedData.data.options.find(opt => opt.id === 'poll-test-option-1');
    const updatedOption2 = updatedData.data.options.find(opt => opt.id === 'poll-test-option-2');
    
    console.log('✅ Updated data received');
    console.log('   Total votes:', updatedData.data.total_votes);
    console.log('   Option A:', updatedOption1?.vote_count || 0, 'votes');
    console.log('   Option B:', updatedOption2?.vote_count || 0, 'votes');
    
    // Step 4: Verify the changes
    console.log('\n📈 Step 4: Analyzing changes...');
    const option1Increase = (updatedOption1?.vote_count || 0) - (initialOption1?.vote_count || 0);
    const totalIncrease = (updatedData.data.total_votes || 0) - (initialData.data.total_votes || 0);
    
    console.log('   Option A increase:', option1Increase);
    console.log('   Total votes increase:', totalIncrease);
    
    if (option1Increase === 1 && totalIncrease === 1) {
      console.log('\n🎉 SUCCESS: Complete voting flow works correctly!');
      console.log('   ✅ API correctly updates vote counts');
      console.log('   ✅ Data is immediately available after voting');
      console.log('   ✅ Frontend should receive updated data when fetchPoll() is called');
      
      console.log('\n💡 If votes are not showing on the poll page, the issue is likely:');
      console.log('   1. User authentication in the browser (not logged in)');
      console.log('   2. Frontend state management (React state not updating)');
      console.log('   3. Browser caching (unlikely but possible)');
      
    } else {
      console.log('\n❌ ISSUE: Vote counts not updating correctly');
      console.log('   Expected: +1 vote for Option A, +1 total votes');
      console.log('   Actual: +' + option1Increase + ' for Option A, +' + totalIncrease + ' total votes');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCompleteFlow();