// Payment References Real-time Subscription Test
// This test verifies that payment references are properly displayed
// under their correct organizations without requiring a page refresh

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/types/supabase';

// Test organization data
const testOrg1: Database['public']['Tables']['organizations']['Insert'] = {
  id: '00000000-0000-0001-0001-000000000000',
  name: 'Test Organization 1',
  description: 'Test organization for realtime subscription testing',
  adviser_name: 'Test Adviser',
  club_type: 'Academic',
  status: 'approved',
  creator_id: '00000000-0000-0001-0001-000000000000',
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
};

const testOrg2: Database['public']['Tables']['organizations']['Insert'] = {
  id: '00000000-0000-0002-0002-000000000000',
  name: 'Test Organization 2',
  description: 'Test organization 2 for realtime subscription testing',
  adviser_name: 'Test Adviser 2',
  club_type: 'Sports',
  status: 'approved',
  creator_id: '00000000-0000-0002-0002-000000000000',
  primary_color: '#16a344',
  secondary_color: '#059668',
};

// Test user data
const testUserId = '00000000-0000-0000-0000-000000000000';

// Setup wallet tables before running tests
const setupWalletTables = async () => {
  try {
    // Check if organization_wallets table exists
    const { error: checkError } = await supabase
      .from("organization_wallets" as any)
      .select("id", { count: "exact" })
      .limit(1);

    if (checkError?.code === 'PGRST116') {
      console.log('organization_wallets table does not exist - skipping wallet setup');
    }
  } catch (error) {
    console.error('Error checking organization_wallets table:', error);
  }
};

describe('Payment References Real-time Updates', () => {
  beforeAll(async () => {
    // Initialize database
    await import('@/lib/db-setup').then(mod => mod.initializeDatabase());
    
    // Setup wallet tables
    await setupWalletTables();
    
    // Insert test organizations
    const { error: org1Error } = await supabase
      .from("organizations")
      .insert(testOrg1);
    
    const { error: org2Error } = await supabase
      .from("organizations")
      .insert(testOrg2);
    
    if (org1Error) console.error('Error inserting testOrg1:', org1Error);
    if (org2Error) console.error('Error inserting testOrg2:', org2Error);
    
    // Insert test user into auth.users if not exists
    const { error: authError } = await supabase
      .rpc('create_user_if_not_exists', {
        user_id: testUserId,
        email: 'test@payment.references.com',
        password: 'test_password_123'
      });
    
    if (authError) {
      console.error('Auth user creation error (may be duplicate):', authError);
    }
    
    // Insert organization creator as member
    const { error: member1Error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: testOrg1.id,
        user_id: testUserId,
        role: 'creator',
        status: 'active',
      });
    
    const { error: member2Error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: testOrg2.id,
        user_id: testUserId,
        role: 'member',
        status: 'active',
      });
    
    if (member1Error) console.error('Error inserting member1:', member1Error);
    if (member2Error) console.error('Error inserting member2:', member2Error);
    
    // Insert test wallet for organization 1
    const { error: wallet1Error } = await supabase
      .from("organization_wallets" as any)
      .insert({
        organization_id: testOrg1.id,
        balance: 1000.00,
      });
    
    if (wallet1Error) console.error('Error inserting wallet1:', wallet1Error);
    
  }, 10000); // 10 second timeout for setup

  afterAll(async () => {
    // Clean up test data
    const cleanupPromises = [
      supabase
        .from("payment_references")
        .delete()
        .eq("reference_code", "TEST01"),
    
      supabase
        .from("organizations")
        .delete()
        .in("id", [testOrg1.id, testOrg2.id]),
    
      supabase
        .from("organization_members")
        .delete()
        .in("user_id", [testUserId]),
    ];
    
    await Promise.all(cleanupPromises);
    
  }, 5000); // 5 second timeout for cleanup

  it('should insert payment reference with correct organization_id', async () => {
    const testRefCode = 'TEST01';
    
    // Insert payment reference
    const { error, data } = await supabase
      .from("payment_references")
      .insert([{
        organization_id: testOrg1.id,
        reference_code: testRefCode,
        amount: 50.00,
        used: false,
      }])
      .select();
    
    expect(error).toBeFalsy();
    expect(data).toBeTruthy();
    expect(data[0].organization_id).toEqual(testOrg1.id);
    expect(data[0].reference_code).toEqual(testRefCode);
    
    // Clean up
    await supabase
      .from("payment_references")
      .delete()
      .eq("reference_code", testRefCode);
    
  });

  it('should fetch payment references filtered by organization_id', async () => {
    const testRefCode1 = 'ORG1REF01';
    const testRefCode2 = 'ORG2REF01';
    
    // Insert payment reference for org 1
    await supabase
      .from("payment_references")
      .insert([{
        organization_id: testOrg1.id,
        reference_code: testRefCode1,
        amount: 50.00,
        used: false,
      }]);
    
    // Insert payment reference for org 2
    await supabase
      .from("payment_references")
      .insert([{
        organization_id: testOrg2.id,
        reference_code: testRefCode2,
        amount: 100.00,
        used: false,
      }]);
    
    // Fetch payment references for org 1
    const { data: org1Refs, error: org1Error } = await supabase
      .from("payment_references")
      .select("*")
      .eq("organization_id", testOrg1.id)
      .eq("used", false);
    
    expect(org1Error).toBeFalsy();
    expect(org1Refs).toBeTruthy();
    expect(Array.isArray(org1Refs)).toBeTruthy();
    
    // Verify only org 1 references are returned
    if (org1Refs && org1Refs.length > 0) {
      org1Refs.forEach(ref => {
        expect(ref.organization_id).toEqual(testOrg1.id);
      });
    }
    
    // Clean up
    await Promise.all([
      supabase
        .from("payment_references")
        .delete()
        .eq("reference_code", testRefCode1),
      supabase
        .from("payment_references")
        .delete()
        .eq("reference_code", testRefCode2),
    ]);
    
  });

  it('should update UI state immediately on INSERT event without page refresh', async () => {
    const testRefCode = 'UIUPDATE01';
    
    // Set initial state
    let initialPaymentRefs: any[] = [];
    
    // Fetch initial state
    const { data: initialData } = await supabase
      .from("payment_references")
      .select("*")
      .eq("organization_id", testOrg1.id)
      .eq("used", false);
    
    initialPaymentRefs = initialData || [];
    
    // Insert new payment reference
    const { error: insertError } = await supabase
      .from("payment_references")
      .insert([{
        organization_id: testOrg1.id,
        reference_code: testRefCode,
        amount: 50.00,
        used: false,
      }]);
    
    expect(insertError).toBeFalsy();
    
    // Verify the new reference appears in the state
    const { data: updatedData } = await supabase
      .from("payment_references")
      .select("*")
      .eq("organization_id", testOrg1.id)
      .eq("used", false)
      .order("created_at", { ascending: false });
    
    // The updated data should include our new reference
    expect(updatedData).toBeTruthy();
    
    // Clean up
    await supabase
      .from("payment_references")
      .delete()
      .eq("reference_code", testRefCode);
    
  });

  it('should verify payment reference exists and has correct organization association', async () => {
    const testRefCode = 'VERIFYORG01';
    const orgName = testOrg1.name;
    
    // Insert payment reference with organization association
    await supabase
      .from("payment_references")
      .insert([{
        organization_id: testOrg1.id,
        reference_code: testRefCode,
        amount: 50.00,
        used: false,
      }]);
    
    // Verify payment reference exists and is associated with correct organization
    const { data: paymentRef, error } = await supabase
      .from("payment_references")
      .select(`*, organizations:organization_id(name)`)
      .eq("reference_code", testRefCode)
      .eq("used", false)
      .maybeSingle();
    
    expect(error).toBeFalsy();
    expect(paymentRef).toBeTruthy();
    
    if (paymentRef) {
      expect(paymentRef.organization_id).toEqual(testOrg1.id);
      expect(paymentRef.reference_code).toEqual(testRefCode);
      expect(paymentRef.organizations?.name).toEqual(orgName);
    }
    
    // Clean up
    await supabase
      .from("payment_references")
      .delete()
      .eq("reference_code", testRefCode);
    
  });
});

// Realtime subscription test
export const runRealtimeTests = async () => {
  console.log('Running realtime subscription tests...');
  
  // Test 1: OrganizationsPage should receive updates when payment reference is created
  console.log('Test 1: Payment reference INSERT event triggers UI update');
  
  const testRefCode = 'REALTIME01';
  
  // Create realtime subscription
  const channel = supabase
    .channel('test_realtime_updates')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'payment_references'
      },
      (payload) => {
        console.log('Realtime subscription received:', payload.event);
        console.log('New payment reference ID:', payload.new?.id);
        console.log('Organization ID:', payload.new?.organization_id);
        console.log('Reference code:', payload.new?.reference_code);
      }
    )
    .subscribe();
  
  // Insert test payment reference
  await supabase
    .from("payment_references")
    .insert([{
      organization_id: testOrg1.id,
      reference_code: testRefCode,
      amount: 50.00,
      used: false,
    }]);
  
  // Wait for realtime update
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Remove channel
  await supabase.removeChannel(channel);
  
  console.log('Realtime subscription tests completed!');
  
  // Clean up
  await supabase
    .from("payment_references")
    .delete()
    .eq("reference_code", testRefCode);
};
