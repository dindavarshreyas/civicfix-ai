import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase.js';
import { env } from '../config/env.js';
import { DEFAULT_DEPARTMENTS } from '../config/constants.js';

async function seedDemoData() {
  console.log('\n======================================================');
  console.log('   CivicMind Demo Seeder (Custom Auth + Clustered Demo)');
  console.log('======================================================\n');

  try {
    // 1. Ensure Departments exist
    console.log('1. Seeding / verifying departments...');
    for (const dept of DEFAULT_DEPARTMENTS) {
      await supabaseAdmin.from('departments').upsert(
        {
          code: dept.code,
          name: dept.name,
          description: dept.description,
          handles_categories: dept.handles_categories,
          contact_email: dept.contact_email,
          sla_hours: { critical: 24, high: 72, medium: 168, low: 336 },
          is_active: true,
        },
        { onConflict: 'code' }
      );
    }
    console.log('✓ Departments seeded successfully.');

    // Fetch Roads Department ID for the officer
    const { data: rpwDept } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('code', 'RPW')
      .single();

    // 2. Demo Users Creation with bcrypt cost 12
    console.log('\n2. Creating demo users in custom users table...');
    const demoPassword = process.env.DEMO_PASSWORD || env.DEMO_PASSWORD || 'DemoPassword123!';
    const passwordHash = await bcrypt.hash(demoPassword, env.BCRYPT_COST);

    const demoUsers = [
      {
        email: 'citizen@demo.test',
        fullName: 'Jane Citizen',
        role: 'citizen',
        deptId: null,
      },
      {
        email: 'officer@demo.test',
        fullName: 'Officer Vikram (Roads & Works)',
        role: 'officer',
        deptId: rpwDept?.id || null,
      },
      {
        email: 'admin@demo.test',
        fullName: 'Commissioner Sarah Admin',
        role: 'admin',
        deptId: null,
      },
    ];

    for (const u of demoUsers) {
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', u.email)
        .maybeSingle();

      if (existing) {
        console.log(`Updating existing user ${u.email}...`);
        await supabaseAdmin
          .from('users')
          .update({
            password_hash: passwordHash,
            full_name: u.fullName,
            role: u.role,
            department_id: u.deptId,
            phone: '+1 555-0199',
            email_notifications: true,
          })
          .eq('id', existing.id);
      } else {
        console.log(`Inserting new user ${u.email}...`);
        await supabaseAdmin.from('users').insert({
          email: u.email,
          password_hash: passwordHash,
          full_name: u.fullName,
          role: u.role,
          department_id: u.deptId,
          phone: '+1 555-0199',
          email_notifications: true,
        });
      }
      console.log(`✓ Configured user ${u.email} [Role: ${u.role}]`);
    }

    // 3. Seed Clustered Canonical Issues for Instant Duplicate Merge Demo
    console.log('\n3. Seeding pre-existing clustered open issues for instant duplicate demo...');
    const sampleIssues = [
      {
        reference_no: 'CIV-2026-000101',
        category: 'road_damage',
        title: 'Deep hazardous crater pothole outside MG Road Metro Station',
        summary: 'Pothole measuring 1.5m wide located near the pedestrian crossing and bus bay on MG Road outside Metro Exit 2. Highly dangerous for two-wheelers and buses.',
        latitude: 12.9721,
        longitude: 77.5950,
        address_text: 'Opposite Metro Exit Gate 2, MG Road, Bengaluru',
        department_id: rpwDept?.id,
        status: 'in_progress',
        priority: 'critical',
        priority_score: 88,
        priority_reasoning: 'Critical danger to two-wheelers and pedestrians at heavy commuter transit junction.',
        severity_factors: { safety_risk: 36, public_impact: 18, location_sensitivity: 14, time_weather_risk: 6, corroboration_bonus: 14 },
        report_count: 4,
        sla_due_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      },
      {
        reference_no: 'CIV-2026-000102',
        category: 'road_damage',
        title: 'Asphalt crumbling and sunken trench on MG Road',
        summary: 'Sunken trench and broken road surface directly adjacent to Metro Exit Gate 2. Vehicle wheels getting trapped.',
        latitude: 12.9722,
        longitude: 77.5951,
        address_text: 'MG Road Metro Station North Curb',
        department_id: rpwDept?.id,
        status: 'triaged',
        priority: 'high',
        priority_score: 75,
        priority_reasoning: 'Proximity to metro transit causes traffic congestion and vehicle damage.',
        severity_factors: { safety_risk: 28, public_impact: 17, location_sensitivity: 15, time_weather_risk: 5, corroboration_bonus: 10 },
        report_count: 2,
        sla_due_at: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      },
      {
        reference_no: 'CIV-2026-000103',
        category: 'garbage',
        title: 'Commercial garbage heap overflowing on Church Street sidewalk',
        summary: 'Piles of restaurant packaging, food waste, and plastic crates obstructing the pedestrian walkway.',
        latitude: 12.9735,
        longitude: 77.5962,
        address_text: 'Church Street & Brigade Road junction',
        status: 'assigned',
        priority: 'high',
        priority_score: 68,
        priority_reasoning: 'Major public hygiene hazard in commercial retail street.',
        severity_factors: { safety_risk: 22, public_impact: 18, location_sensitivity: 13, time_weather_risk: 9, corroboration_bonus: 6 },
        report_count: 3,
        sla_due_at: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      },
    ];

    for (const iss of sampleIssues) {
      const { data: existing } = await supabaseAdmin
        .from('issues')
        .select('id')
        .eq('reference_no', iss.reference_no)
        .maybeSingle();

      if (!existing) {
        await supabaseAdmin.from('issues').insert(iss);
        console.log(`✓ Inserted demo issue: ${iss.reference_no} (${iss.category}) at (${iss.latitude}, ${iss.longitude})`);
      } else {
        console.log(`Demo issue ${iss.reference_no} already exists.`);
      }
    }

    console.log('\n======================================================');
    console.log('   Demo Seed Complete!');
    console.log('   Demo Credentials:');
    console.log('   - Citizen: citizen@demo.test / ' + demoPassword);
    console.log('   - Officer: officer@demo.test / ' + demoPassword);
    console.log('   - Admin:   admin@demo.test   / ' + demoPassword);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Error during demo seed:', err.message);
  }
}

seedDemoData();
