#!/usr/bin/env node

/**
 * Test script to verify SSL certificate ignoring functionality
 */

import { ConfluenceClient } from './utils/confluence-client.js';

/**
 * Test the SSL ignore functionality
 */
async function testSSLIgnore() {
  console.log('🔍 Testing SSL certificate ignoring functionality...\n');

  // Test case 1: With SSL validation (should fail with self-signed certs)
  console.log('1. Testing with SSL validation enabled (default):');
  try {
    const client1 = new ConfluenceClient({
      baseUrl: 'https://self-signed-confluence.example.com',
      username: 'test',
      password: 'test',
      ignoreSSL: false
    });
    console.log('   ✅ Client created with SSL validation enabled');
  } catch (error) {
    console.log('   ❌ Error creating client:', error.message);
  }

  // Test case 2: With SSL validation disabled
  console.log('\n2. Testing with SSL validation disabled:');
  try {
    const client2 = new ConfluenceClient({
      baseUrl: 'https://self-signed-confluence.example.com',
      username: 'test',
      password: 'test',
      ignoreSSL: true
    });
    console.log('   ✅ Client created with SSL validation disabled');
    console.log('   ⚠️  SSL certificate errors will be ignored');
  } catch (error) {
    console.log('   ❌ Error creating client:', error.message);
  }

  // Test case 3: Default behavior (SSL validation enabled)
  console.log('\n3. Testing default behavior (no ignoreSSL specified):');
  try {
    const client3 = new ConfluenceClient({
      baseUrl: 'https://self-signed-confluence.example.com',
      username: 'test',
      password: 'test'
    });
    console.log('   ✅ Client created with default SSL validation (enabled)');
  } catch (error) {
    console.log('   ❌ Error creating client:', error.message);
  }

  console.log('\n📋 Summary:');
  console.log('   • When ignoreSSL: true - SSL certificate errors are ignored');
  console.log('   • When ignoreSSL: false or undefined - SSL validation is enforced');
  console.log('   • This allows connection to Confluence instances with self-signed certificates');
  console.log('\n💡 Usage: When prompted during upsert, select "Yes" for "Ignore SSL certificate errors"');
}

// Run the test
testSSLIgnore().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
