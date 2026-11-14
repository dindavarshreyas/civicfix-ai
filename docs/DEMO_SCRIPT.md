# CivicMind: 4-Minute Demonstration Video Script

This script outlines the exact shot list, screen navigation, and spoken voiceover for a 4-minute evaluation video showcasing CivicMind's autonomous multi-agent pipeline.

---

## Video Overview & Timing

- **Total Duration**: 4 Minutes (0:00 – 4:00)
- **Roles Featured**: Citizen, Officer, and City Administrator
- **Key Capabilities Highlighted**:
  1. Multimodal AI Report Intake (Photo + Text)
  2. Autonomous Multi-Agent Pipeline Execution & Live Audit Trace
  3. Spatial + Semantic Duplicate Detection and Automated Merge
  4. Officer Command Queue & AI Override Trail
  5. Simulated Workflow Lifecycle & Accelerated Demo Time-Scaling

---

## Scene-by-Scene Shot List

### Scene 1: Introduction & The Civic Problem (0:00 – 0:35)
- **Screen View**: CivicMind Landing Page (`/`). Dark mode enabled. Public Issue Map showing active city incidents.
- **Visual Action**: Pan across the interactive city map displaying clustered pins for potholes, overflowing garbage, and broken streetlights. Hover over a pin showing live status badges and SLA countdowns.
- **Voiceover**:
  > *"Every day, citizens encounter broken roads, overflowing garbage bins, and hazardous wiring. Today's reporting process is fragmented, slow, and confusing. Citizens don't know which department to contact, duplicate reports flood dispatch centers, and complaints disappear into a bureaucratic black hole. This is CivicMind — an autonomous, agentic AI platform that coordinates civic issues from raw intake to field resolution without manual triage."*

---

### Scene 2: Citizen Intake & Autonomous Multi-Agent Pipeline (0:35 – 1:30)
- **Screen View**: Login as `citizen@demo.test`, navigate to Report Submission (`/reports/new`).
- **Visual Action**:
  1. Click **Use My Location** (or click on the map pin near MG Road, Bengaluru).
  2. Upload a photo of a severe pothole (`pothole.jpg`).
  3. Type a brief sentence: *"Dangerous deep hole near the bus shelter entrance."*
  4. Click **Submit & Start Autonomous Pipeline**.
  5. The screen immediately transitions to the **Live Agent Pipeline Progress View** (`/reports/:id/processing`).
  6. Watch the steps light up in real time:
     - Step 1: Vision & Intake Agent (Classifies `road_damage`, extracts severity factors).
     - Step 2: Department Routing Agent (Assigns Roads & Public Works).
     - Step 3: Priority Scoring Agent (Computes 86/100, assigns Critical priority).
     - Step 4: Duplicate Detection Agent.
     - Step 5: Complaint Drafting Agent (Generates formal municipal ticket).
     - Step 6: Notification Agent (Dispatches intake confirmation).
- **Voiceover**:
  > *"A citizen submits a single photo and an informal description. In seconds, our autonomous multi-agent pipeline activates. The Vision Agent analyzes the image, identifies a structural asphalt failure, and rates high confidence. The Department Routing Agent maps it to Roads & Public Works. The Priority Agent scores risk based on transit proximity and weather vulnerability. The Drafting Agent structures a formal municipal work order with reference CIV-2026-000104. No human triage was required."*

---

### Scene 3: Instant Duplicate Detection & Auto-Merge Demo (1:30 – 2:20)
- **Screen View**: Return to `/reports/new`.
- **Visual Action**:
  1. Set location coordinates to the exact same spot at MG Road Metro (`12.9721, 77.5950`).
  2. Upload an image or type: *"Big crater on the road near MG Road Metro exit, cars swerving."*
  3. Click **Submit**.
  4. On the processing screen, show the Duplicate Detection Agent triggering:
     - Notice: *"Identified pre-existing open issue CIV-2026-000101 within 15 meters."*
     - Semantic similarity: `89%`.
     - State: **Merged with Canonical Issue**. Report count increments from 4 to 5.
  5. Open the Notification Bell: show the personalized notification: *"Your report was merged with existing canonical issue CIV-2026-000101. You will receive all future progress updates."*
- **Voiceover**:
  > *"Now watch our Duplicate Detection Agent in action. A second citizen reports the same road hazard. Instead of cluttering the queue with redundant tickets, the agent runs a PostgreSQL Haversine geospatial pre-filter combined with semantic AI comparison. It identifies the existing issue, automatically merges the complaint, escalates the priority score due to increased report frequency, and links the new reporter to the single canonical timeline."*

---

### Scene 4: Agent Trace & Explainability (2:20 – 2:55)
- **Screen View**: Navigate to Agent Trace view (`/agent-runs`).
- **Visual Action**:
  1. Inspect the chronological run log for the pipeline execution.
  2. Click into the **Vision Agent** card: show the input image thumbnail, latency (1,150 ms), model (`gemini-2.5-flash`), and full reasoning JSON.
  3. Click into the **Priority Agent** card: highlight the weighted formula breakdown showing baseline severity, location sensitivity bonus, and weather multipliers.
- **Voiceover**:
  > *"Transparency is essential for civic infrastructure. In the Agent Trace interface, every decision made by each agent is recorded with model version, latency, prompt tokens, and explainable natural-language reasoning. Municipal auditors can inspect exactly why an issue was assigned critical priority or why a department was selected."*

---

### Scene 5: Officer Workflow & Human-in-the-Loop Override (2:55 – 3:30)
- **Screen View**: Log in as `officer@demo.test` (Roads & Works Inspector). Navigate to `/officer/queue`.
- **Visual Action**:
  1. View the prioritized department queue sorted by priority score.
  2. Open the canonical issue detail page (`/officer/issues/:id`).
  3. Show the anonymized citizen reports ("Citizen #1", "Citizen #2").
  4. Demonstrate an **AI Decision Override**:
     - Change Priority from "Critical" to "High" with justification: *"Field inspection confirms traffic barrier deployed; hazard mitigated."*
     - Submit override. Show the audit history banner updating instantly with officer ID, timestamp, and explanation.
- **Voiceover**:
  > *"Officers receive a clean, deduplicated dashboard filtered by their department. Citizens' identities are protected via automated anonymization. Officers can easily update status or perform a Human-in-the-Loop override if field conditions change. The system audits all overrides and recalculates SLAs accordingly."*

---

### Scene 6: Simulated Municipal Lifecycle & Admin Controls (3:30 – 4:00)
- **Screen View**: Log in as `admin@demo.test`. Navigate to `/admin`.
- **Visual Action**:
  1. Review the real-time analytics dashboard: Resolution rates, SLA breach metrics, category breakdown charts.
  2. Click the **Advance workflow now** button.
  3. Show the toast confirmation: *"Workflow tick executed! Advanced 3 issue(s)."*
  4. Switch to Citizen My Reports (`/my-reports`): show the issue has progressed from `triaged` to `assigned` to `in_progress`.
- **Voiceover**:
  > *"CivicMind's pluggable workflow engine simulates real-world municipal lifecycles with configurable time-scaling. Administrators can force status reconciliation instantly. Citizens receive real-time updates every step of the way. CivicMind delivers speed for citizens, efficiency for cities, and full explainability for administrators."*
