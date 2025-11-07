#!/usr/bin/env node
import 'dotenv/config';

const TEST_USER = {
  name: process.env.SEED_TEST_USER_NAME || 'Test User',
  email: process.env.SEED_TEST_USER_EMAIL || 'test@test.com',
  password: process.env.SEED_TEST_USER_PASSWORD || 'Test12345!',
};

const API_BASE_URL = process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Extract session cookie from response headers
function getSessionCookie(response) {
  const setCookieHeader = response.headers.get('set-cookie');
  if (!setCookieHeader) return null;
  
  const match = setCookieHeader.match(/better-auth\.session_token=([^;]+)/);
  return match ? match[1] : null;
}

async function seedTestUser() {
  try {
    console.log('Connecting to auth API...');

    // Check if user already exists by trying to sign in
    console.log('Checking for existing test user...');
    const signInResponse = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    if (signInResponse.ok) {
      const signInData = await signInResponse.json();
      const sessionCookie = getSessionCookie(signInResponse);
      
      console.log(`Test user already exists`);
      console.log(`  ID: ${signInData.user?.id || 'N/A'}`);
      console.log(`  Email: ${TEST_USER.email}`);
      console.log('  Password: [unchanged – delete user to recreate with new password]');
      
      // Verify household access via API
      if (sessionCookie) {
        const householdsResponse = await fetch(`${API_BASE_URL}/api/households`, {
          headers: {
            'Cookie': `better-auth.session_token=${sessionCookie}`,
          },
        });
        
        if (householdsResponse.ok) {
          const households = await householdsResponse.json();
          if (households.length > 0) {
            console.log(`  Household: ${households[0].name} (ID: ${households[0].id})`);
          }
        }
      }
      
      return;
    }

    console.log('Creating demo user...');

    // Use Better Auth HTTP API to create user
    const signUpResponse = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: TEST_USER.password,
        callbackURL: '/',
      }),
    });

    if (!signUpResponse.ok) {
      const errorText = await signUpResponse.text();
      console.error(`  API Response Status: ${signUpResponse.status}`);
      console.error(`  API Response Body: ${errorText.substring(0, 500)}`);
      throw new Error(`Sign-up failed: ${signUpResponse.status}`);
    }

    const signUpData = await signUpResponse.json();

    if (!signUpData || !signUpData.user) {
      throw new Error('No user data returned from sign-up API');
    }

    // Verify the user was created by signing in
    console.log('Verifying user can sign in...');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
      }),
    });

    if (!verifyResponse.ok) {
      throw new Error('User created but sign-in verification failed!');
    }

    const sessionCookie = getSessionCookie(verifyResponse);

    if (!sessionCookie) {
      throw new Error('No session cookie received after sign-in');
    }

    // Verify household access via API
    console.log('Verifying household access...');
    const householdsResponse = await fetch(`${API_BASE_URL}/api/households`, {
      headers: {
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
    });

    if (!householdsResponse.ok) {
      throw new Error(`Failed to fetch households: ${householdsResponse.status}`);
    }

    const households = await householdsResponse.json();

    if (households.length === 0) {
      throw new Error('No household found for user - auth hook may have failed');
    }

    console.log('Demo user created and verified successfully!');
    console.log(`  User ID: ${signUpData.user.id}`);
    console.log(`  Email: ${signUpData.user.email}`);
    console.log(`  Password: ${TEST_USER.password}`);
    console.log(`  Sign-in verified`);
    console.log(`  Household access verified`);
    console.log(`  Household ID: ${households[0].id}`);
    console.log(`  Household Name: ${households[0].name}`);

    // Create test persons with financial data
    console.log('');
    console.log('Creating test persons...');
    
    const householdId = households[0].id;
    
    // Create Alice
    const aliceResponse = await fetch(`${API_BASE_URL}/api/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        name: 'Alice',
        age: 30,
        household_id: householdId,
      }),
    });
    
    if (!aliceResponse.ok) {
      throw new Error(`Failed to create Alice: ${aliceResponse.status}`);
    }
    
    const alice = await aliceResponse.json();
    console.log(`  Created person: Alice (ID: ${alice.id})`);
    
    // Create Bob
    const bobResponse = await fetch(`${API_BASE_URL}/api/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        name: 'Bob',
        age: 32,
        household_id: householdId,
      }),
    });
    
    if (!bobResponse.ok) {
      throw new Error(`Failed to create Bob: ${bobResponse.status}`);
    }
    
    const bob = await bobResponse.json();
    console.log(`  Created person: Bob (ID: ${bob.id})`);
    
    // Create Alice's income
    const aliceIncomeResponse = await fetch(`${API_BASE_URL}/api/income-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        person_id: alice.id,
        name: 'Software Engineer Salary',
        amount: 5000,
        frequency: 'monthly',
        is_active: true,
      }),
    });
    
    if (aliceIncomeResponse.ok) {
      console.log(`  Created income for Alice: Software Engineer Salary ($5,000/month)`);
    }
    
    // Create Bob's income
    const bobIncomeResponse = await fetch(`${API_BASE_URL}/api/income-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        person_id: bob.id,
        name: 'Product Manager Salary',
        amount: 6000,
        frequency: 'monthly',
        is_active: true,
      }),
    });
    
    if (bobIncomeResponse.ok) {
      console.log(`  Created income for Bob: Product Manager Salary ($6,000/month)`);
    }
    
    // Create Alice's savings account
    const aliceSavingsResponse = await fetch(`${API_BASE_URL}/api/savings-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: alice.id,
        name: 'Emergency Fund',
        currentBalance: 15000,
        monthlyDeposit: 300,
        interestRate: 2.5,
        accountType: 'savings',
      }),
    });
    
    if (!aliceSavingsResponse.ok) {
      throw new Error(`Failed to create Alice's savings: ${aliceSavingsResponse.status}`);
    }
    
    const aliceSavings = await aliceSavingsResponse.json();
    console.log(`  Created savings for Alice: Emergency Fund ($15,000 @ 2.5%, $300/month)`);
    
    // Create Bob's savings account
    const bobSavingsResponse = await fetch(`${API_BASE_URL}/api/savings-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: bob.id,
        name: 'Investment Account',
        currentBalance: 25000,
        monthlyDeposit: 500,
        interestRate: 5.0,
        accountType: 'investment',
      }),
    });
    
    if (!bobSavingsResponse.ok) {
      throw new Error(`Failed to create Bob's savings: ${bobSavingsResponse.status}`);
    }
    
    const bobSavings = await bobSavingsResponse.json();
    console.log(`  Created savings for Bob: Investment Account ($25,000 @ 5.0%, $500/month)`);
    
    // Create Alice's loan
    const aliceLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: alice.id,
        name: 'Student Loan',
        originalAmount: 30000,
        currentBalance: 20000,
        interestRate: 4.5,
        monthlyPayment: 400,
        loanType: 'student',
      }),
    });
    
    if (aliceLoanResponse.ok) {
      console.log(`  Created loan for Alice: Student Loan ($20,000 balance @ 4.5%)`);
    }
    
    // Create Bob's loan
    const bobLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: bob.id,
        name: 'Car Loan',
        originalAmount: 25000,
        currentBalance: 18000,
        interestRate: 3.9,
        monthlyPayment: 500,
        loanType: 'auto',
      }),
    });
    
    if (bobLoanResponse.ok) {
      console.log(`  Created loan for Bob: Car Loan ($18,000 balance @ 3.9%)`);
    }
    
    // Create household savings goal with linked accounts
    const savingsGoalResponse = await fetch(`${API_BASE_URL}/api/savings-goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        householdId: householdId,
        name: 'House Down Payment',
        description: 'Save for 20% down payment on a new home',
        targetAmount: 50000,
        priority: 3, // high priority
        category: 'house',
        savingsAccountIds: [aliceSavings.id, bobSavings.id], // Link both accounts
      }),
    });
    
    if (!savingsGoalResponse.ok) {
      throw new Error(`Failed to create savings goal: ${savingsGoalResponse.status}`);
    }
    
    await savingsGoalResponse.json();
    console.log(`  Created savings goal: House Down Payment ($50,000 target)`);
    console.log(`  Linked 2 savings accounts to goal (Alice's & Bob's)`);
    
    console.log('');
    console.log('Test data created successfully!');
  } catch (error) {
    console.error('Failed to seed demo user:', error.message);
    if (process.env.DEBUG) {
      console.error(error);
    }
    process.exitCode = 1;
  }
}

seedTestUser();
