import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing database write operations...')
    
    const testResults = {
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // Test 1: Create a test user
    testResults.tests.push({ name: 'Create Test User', status: 'running' })
    const testUser = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        username: `testuser-${Date.now()}`,
        name: 'Test User',
        password: 'hashedpassword123',
        instruments: JSON.stringify(['Guitar', 'Vocals'])
      }
    })
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Create Test User',
      status: 'success',
      result: { 
        userId: testUser.id.substring(0, 8) + '...',
        email: testUser.email 
      }
    }

    // Test 2: Read the user back
    testResults.tests.push({ name: 'Read Test User', status: 'running' })
    const foundUser = await db.user.findUnique({
      where: { id: testUser.id }
    })
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Read Test User',
      status: 'success',
      result: { found: !!foundUser, email: foundUser?.email }
    }

    // Test 3: Count total users
    testResults.tests.push({ name: 'Count All Users', status: 'running' })
    const userCount = await db.user.count()
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Count All Users',
      status: 'success',
      result: { totalUsers: userCount }
    }

    // Test 4: Clean up - delete the test user
    testResults.tests.push({ name: 'Delete Test User', status: 'running' })
    await db.user.delete({
      where: { id: testUser.id }
    })
    testResults.tests[testResults.tests.length - 1] = {
      name: 'Delete Test User',
      status: 'success',
      result: { deleted: true }
    }

    // Convert BigInt values for JSON serialization
    const sanitizedResults = JSON.parse(JSON.stringify(testResults, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ))

    return NextResponse.json({
      success: true,
      message: 'All write tests passed!',
      ...sanitizedResults
    })

  } catch (error) {
    console.error('❌ Write test failed:', error)
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      name: error instanceof Error ? error.name : undefined
    }

    return NextResponse.json({
      success: false,
      error: errorDetails.message,
      errorDetails
    }, { status: 500 })
  }
}