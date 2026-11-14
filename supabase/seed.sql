-- CivicMind: Seed Data for Departments, Sample Clustered Issues, and Demonstrations

-- Seed Departments
insert into departments (code, name, description, handles_categories, contact_email, sla_hours) values
('SWM','Solid Waste Management','Garbage collection, bin overflow, illegal dumping, street sweeping','{garbage}','swm@city.example','{"critical":24,"high":72,"medium":168,"low":336}'),
('RPW','Roads & Public Works','Potholes, road cracks, broken pavements, road restoration','{road_damage}','roads@city.example','{"critical":24,"high":72,"medium":168,"low":336}'),
('ESL','Electrical & Street Lighting','Streetlight installation, repair and exposed street wiring','{streetlight}','lighting@city.example','{"critical":24,"high":72,"medium":168,"low":336}'),
('WSB','Water Supply & Sewerage Board','Water mains, pipe leaks, burst pipes, supply disruptions','{water_leakage}','water@city.example','{"critical":24,"high":72,"medium":168,"low":336}'),
('DSW','Drainage & Storm Water','Blocked drains, sewer overflow, waterlogging, culvert cleaning','{drainage}','drainage@city.example','{"critical":24,"high":72,"medium":168,"low":336}'),
('GGC','General Grievance Cell','Triage for unclassified or ambiguous civic complaints','{other}','grievance@city.example','{"critical":24,"high":72,"medium":168,"low":336}')
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  handles_categories = excluded.handles_categories,
  contact_email = excluded.contact_email;

-- Seed Sample Canonical Issues (Downtown / Central Civic Cluster for Map & Demo)
-- Reference coordinates: 12.9716, 77.5946 (MG Road / Brigade Road civic area)
insert into issues (
  reference_no, category, title, summary, latitude, longitude, address_text,
  department_id, status, priority, priority_score, priority_reasoning,
  severity_factors, report_count, sla_due_at, first_reported_at, last_reported_at
)
select
  'CIV-2026-000101',
  'road_damage'::issue_category,
  'Hazardous pothole near metro station exit',
  'Deep pothole measuring approximately 1.5m wide located right near the bus bay and pedestrian crossing, posing severe risk to two-wheelers and pedestrians.',
  12.9721,
  77.5950,
  'Opposite Metro Exit Gate 2, MG Road',
  (select id from departments where code = 'RPW' limit 1),
  'in_progress'::issue_status,
  'critical'::priority_level,
  86,
  'High vehicle footfall at metro exit, depth exceeding 15cm creates imminent accident hazard.',
  '{"safety_risk": 36, "public_impact": 18, "location_sensitivity": 14, "time_weather_risk": 6, "corroboration_bonus": 12}',
  5,
  now() + interval '18 hours',
  now() - interval '6 hours',
  now() - interval '1 hour'
where not exists (select 1 from issues where reference_no = 'CIV-2026-000101');

insert into issues (
  reference_no, category, title, summary, latitude, longitude, address_text,
  department_id, status, priority, priority_score, priority_reasoning,
  severity_factors, report_count, sla_due_at, first_reported_at, last_reported_at
)
select
  'CIV-2026-000102',
  'garbage'::issue_category,
  'Overflowing commercial garbage dump near food court',
  'Massive accumulation of wet organic waste and plastic containers overflowing onto the sidewalk, creating intense odour and blocking pedestrian passage.',
  12.9735,
  77.5962,
  'Corner of Church Street & Rest House Road',
  (select id from departments where code = 'SWM' limit 1),
  'assigned'::issue_status,
  'high'::priority_level,
  68,
  'Significant health and pest hazard in a high-footfall commercial dining district.',
  '{"safety_risk": 22, "public_impact": 18, "location_sensitivity": 13, "time_weather_risk": 9, "corroboration_bonus": 6}',
  3,
  now() + interval '42 hours',
  now() - interval '12 hours',
  now() - interval '2 hours'
where not exists (select 1 from issues where reference_no = 'CIV-2026-000102');

insert into issues (
  reference_no, category, title, summary, latitude, longitude, address_text,
  department_id, status, priority, priority_score, priority_reasoning,
  severity_factors, report_count, sla_due_at, first_reported_at, last_reported_at
)
select
  'CIV-2026-000103',
  'streetlight'::issue_category,
  'Flickering streetlights and loose junction box wires',
  'A row of 3 streetlights are non-functional and one pole has an exposed wire bundle accessible to children near the park entrance.',
  12.9698,
  77.5912,
  'Public Park Gate 1, Residency Road',
  (select id from departments where code = 'ESL' limit 1),
  'triaged'::issue_status,
  'critical'::priority_level,
  91,
  'Exposed electrical wiring at waist height immediately adjacent to public park and dark walkway.',
  '{"safety_risk": 39, "public_impact": 16, "location_sensitivity": 14, "time_weather_risk": 7, "corroboration_bonus": 15}',
  6,
  now() + interval '12 hours',
  now() - interval '4 hours',
  now() - interval '30 minutes'
where not exists (select 1 from issues where reference_no = 'CIV-2026-000103');

insert into issues (
  reference_no, category, title, summary, latitude, longitude, address_text,
  department_id, status, priority, priority_score, priority_reasoning,
  severity_factors, report_count, sla_due_at, first_reported_at, last_reported_at
)
select
  'CIV-2026-000104',
  'water_leakage'::issue_category,
  'Main distribution pipe leakage flooding road shoulder',
  'Continuous pressurized clean water leak eroding road sub-base and causing continuous ponding on the outer lane.',
  12.9750,
  77.5930,
  'Near St. Marks Cathedral circle',
  (select id from departments where code = 'WSB' limit 1),
  'in_progress'::issue_status,
  'medium'::priority_level,
  55,
  'Moderate water resource loss and road erosion, no immediate danger to life.',
  '{"safety_risk": 15, "public_impact": 14, "location_sensitivity": 11, "time_weather_risk": 9, "corroboration_bonus": 6}',
  3,
  now() + interval '96 hours',
  now() - interval '24 hours',
  now() - interval '5 hours'
where not exists (select 1 from issues where reference_no = 'CIV-2026-000104');

insert into issues (
  reference_no, category, title, summary, latitude, longitude, address_text,
  department_id, status, priority, priority_score, priority_reasoning,
  severity_factors, report_count, sla_due_at, first_reported_at, last_reported_at
)
select
  'CIV-2026-000105',
  'drainage'::issue_category,
  'Stormwater storm drain clogged with construction silt',
  'Heavy silt and debris completely blocking storm drain inlet, leading to backflow and 1-foot ponding during brief showers.',
  12.9705,
  77.5980,
  'Brigade Road Junction near Comm. Bank',
  (select id from departments where code = 'DSW' limit 1),
  'submitted'::issue_status,
  'high'::priority_level,
  64,
  'Impending monsoon risk; drain blockage causes rapid waterlogging and traffic paralysis at key intersection.',
  '{"safety_risk": 20, "public_impact": 17, "location_sensitivity": 13, "time_weather_risk": 10, "corroboration_bonus": 4}',
  2,
  now() + interval '58 hours',
  now() - interval '3 hours',
  now() - interval '1 hour'
where not exists (select 1 from issues where reference_no = 'CIV-2026-000105');
