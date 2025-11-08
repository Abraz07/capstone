#!/usr/bin/env node
/**
 * Test ML Service Connection
 * This script tests if the backend can connect to the ML service
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function testMLService() {
    console.log('🧪 Testing ML Service Connection...\n');
    
    // Test 1: Direct ML Service Health Check
    console.log('1️⃣ Testing ML Service directly...');
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
        console.log('   ✅ ML Service is running!');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('   ❌ ML Service is not reachable!');
        console.log('   Error:', error.message);
        console.log(`   Make sure ML service is running on ${ML_SERVICE_URL}`);
        return false;
    }
    
    // Test 2: ML Service Root Endpoint
    console.log('\n2️⃣ Testing ML Service root endpoint...');
    try {
        const response = await axios.get(`${ML_SERVICE_URL}/`, { timeout: 5000 });
        console.log('   ✅ ML Service root endpoint works!');
        console.log('   Available endpoints:', response.data.endpoints);
    } catch (error) {
        console.log('   ⚠️  ML Service root endpoint error:', error.message);
    }
    
    // Test 3: Backend ML Health Check
    console.log('\n3️⃣ Testing Backend ML route...');
    try {
        const response = await axios.get(`${BACKEND_URL}/api/ml/health`, { timeout: 5000 });
        console.log('   ✅ Backend ML route is working!');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('   ⚠️  Backend ML route error:', error.message);
        console.log('   Make sure backend is running on', BACKEND_URL);
    }
    
    // Test 4: Backend Health Check (includes ML status)
    console.log('\n4️⃣ Testing Backend health (with ML status)...');
    try {
        const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
        console.log('   ✅ Backend is running!');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('   ⚠️  Backend health check error:', error.message);
    }
    
    console.log('\n✅ Connection test complete!');
    console.log('\n📝 Summary:');
    console.log(`   ML Service URL: ${ML_SERVICE_URL}`);
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log('\n💡 If ML service is not connected, make sure:');
    console.log('   1. ML service is running: cd ml_service && ./RESTART.sh');
    console.log('   2. ML service is accessible on port 8001');
    console.log('   3. Backend ML_SERVICE_URL env var is set correctly');
    
    return true;
}

testMLService().catch(console.error);

