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
          const householdsData = await householdsResponse.json();
          const households = householdsData.data || []; // Unwrap API response
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

    const householdsData = await householdsResponse.json();
    const households = householdsData.data || []; // Unwrap API response

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
    
    // Create Astrid
    const astridResponse = await fetch(`${API_BASE_URL}/api/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        name: 'Astrid',
        age: 30,
        householdId: householdId,
      }),
    });
    
    if (!astridResponse.ok) {
      throw new Error(`Failed to create Astrid: ${astridResponse.status}`);
    }
    
    const astridData = await astridResponse.json();
    const astrid = astridData.data; // Unwrap API response
    console.log(`  Created person: Astrid (ID: ${astrid.id})`);
    
    // Create Filip
    const filipResponse = await fetch(`${API_BASE_URL}/api/persons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        name: 'Filip',
        age: 32,
        householdId: householdId,
      }),
    });
    
    if (!filipResponse.ok) {
      throw new Error(`Failed to create Filip: ${filipResponse.status}`);
    }
    
    const filipData = await filipResponse.json();
    const filip = filipData.data; // Unwrap API response
    console.log(`  Created person: Filip (ID: ${filip.id})`);
    
    // Create Astrid's income
    const astridIncomeResponse = await fetch(`${API_BASE_URL}/api/income-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: astrid.id,
        name: 'Utvecklare lön',
        amount: '28900',
        frequency: 'monthly',
        isActive: true,
      }),
    });
    
    if (astridIncomeResponse.ok) {
      console.log(`  Created income for Astrid: Utvecklare lön (28 900 kr/månad)`);
    }
    
    // Create Filip's income
    const filipIncomeResponse = await fetch(`${API_BASE_URL}/api/income-sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: filip.id,
        name: 'Produktchef lön',
        amount: '33800',
        frequency: 'monthly',
        isActive: true,
      }),
    });
    
    if (filipIncomeResponse.ok) {
      console.log(`  Created income for Filip: Produktchef lön (33 800 kr/månad)`);
    }
    
    // Create Astrid's savings account
    const astridSavingsResponse = await fetch(`${API_BASE_URL}/api/savings-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: astrid.id,
        name: 'Buffert',
        currentBalance: '125000',
        monthlyDeposit: '3000',
        interestRate: '3.0',
        accountType: 'savings',
      }),
    });
    
    if (!astridSavingsResponse.ok) {
      throw new Error(`Failed to create Astrid's savings: ${astridSavingsResponse.status}`);
    }
    
    const astridSavingsData = await astridSavingsResponse.json();
    const astridSavings = astridSavingsData.data; // Unwrap API response
    console.log(`  Created savings for Astrid: Buffert (125 000 kr @ 3.0%, 3 000 kr/månad)`);
    
    // Create Filip's savings account
    const filipSavingsResponse = await fetch(`${API_BASE_URL}/api/savings-accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: filip.id,
        name: 'Investeringskonto',
        currentBalance: '215000',
        monthlyDeposit: '5000',
        interestRate: '6.5',
        accountType: 'investment',
      }),
    });
    
    if (!filipSavingsResponse.ok) {
      throw new Error(`Failed to create Filip's savings: ${filipSavingsResponse.status}`);
    }
    
    const filipSavingsData = await filipSavingsResponse.json();
    const filipSavings = filipSavingsData.data; // Unwrap API response
    console.log(`  Created savings for Filip: Investeringskonto (215 000 kr @ 6.5%, 5 000 kr/månad)`);
    
    // Create Astrid's loan
    const astridLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: astrid.id,
        name: 'CSN-lån',
        originalAmount: '280000',
        currentBalance: '185000',
        interestRate: '1.5',
        monthlyPayment: '2800',
        loanType: 'student',
      }),
    });
    
    if (astridLoanResponse.ok) {
      console.log(`  Created loan for Astrid: CSN-lån (185 000 kr skuld @ 1.5%)`);
    }
    
    // Create Filip's loan
    const filipLoanResponse = await fetch(`${API_BASE_URL}/api/loans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `better-auth.session_token=${sessionCookie}`,
      },
      body: JSON.stringify({
        personId: filip.id,
        name: 'Billån',
        originalAmount: '250000',
        currentBalance: '175000',
        interestRate: '4.2',
        monthlyPayment: '4500',
        loanType: 'auto',
      }),
    });
    
    if (filipLoanResponse.ok) {
      console.log(`  Created loan for Filip: Billån (175 000 kr skuld @ 4.2%)`);
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
        name: 'Kontantinsats villa',
        description: 'Spara till 15% kontantinsats för ett nytt hus',
        targetAmount: '500000',
        priority: 3, // high priority
        category: 'house',
        savingsAccountIds: [astridSavings.id, filipSavings.id], // Link both accounts
      }),
    });
    
    if (!savingsGoalResponse.ok) {
      throw new Error(`Failed to create savings goal: ${savingsGoalResponse.status}`);
    }
    
    await savingsGoalResponse.json();
    console.log(`  Created savings goal: Kontantinsats villa (500 000 kr målbelopp)`);
    console.log(`  Linked 2 savings accounts to goal (Astrid's & Filip's)`);
    
    // Create budget expenses for the household
    console.log('');
    console.log('Creating budget expenses...');
    
    const budgetExpenses = [
      { name: 'Hyra', amount: '14000', category: 'housing' },
      { name: 'El & Vatten', amount: '1200', category: 'utilities' },
      { name: 'Bredband', amount: '399', category: 'utilities' },
      { name: 'Mat & Hushåll', amount: '6500', category: 'food' },
      { name: 'Kollektivtrafik', amount: '1800', category: 'transportation' },
    ];
    
    for (const expense of budgetExpenses) {
      const expenseResponse = await fetch(`${API_BASE_URL}/api/budget-expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `better-auth.session_token=${sessionCookie}`,
        },
        body: JSON.stringify(expense),
      });
      
      if (expenseResponse.ok) {
        console.log(`  Created budget expense: ${expense.name} (${expense.amount} kr/månad)`);
      }
    }
    
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
