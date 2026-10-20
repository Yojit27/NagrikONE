import { CivicReport } from '../types';

export const INITIAL_REPORTS: CivicReport[] = [
  // Stage 1 Report: Newly submitted (< 24h old, within SLA, live countdown active)
  {
    id: 'NGK-1021',
    title: 'Severe deep pothole causing traffic slowdown and two-wheeler skids',
    description:
      'A large, hazardous pothole approximately 2.5 feet wide and 6 inches deep on the right lane near the metro intersection. Two motorcyclists swerved dangerously this morning.',
    category: 'road_pothole',
    status: 'In Progress',
    priority: 'high',
    severity_score: 8,
    severity_label: 'High Priority (Accident Hazard)',
    department: 'Public Works Department (PWD) Division II',
    sla_hours: 72,
    imageUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.6289,
    longitude: 77.2065,
    accuracy: 8,
    address: 'Ring Road near Metro Pillar 142, Central Ward',
    location_name: 'Ring Road near Metro Pillar 142, Central Ward',
    ward: 'Ward 42 (Civil Lines)',
    upvotes: 48,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(), // 14h old, SLA 72h -> Stage 1 (58h left)
    reportedBy: 'Citizen_Rohit',
    isUserSubmitted: false,
    safety_hazards: [
      'High risk of two-wheeler slip during evening rush hour',
      'Sudden braking creating rear-end collision hazard',
    ],
    administrative_summary:
      'Bituminous pavement cavitation detected. Hot mix asphalt patch crew deployed with roller compaction unit.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        note: 'Grievance ticket generated via NagrikOne AI. PWD Central Ward notified.',
        officer: 'System AI Dispatcher',
      },
      {
        status: 'In Review',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        note: 'Site inspection completed by Junior Engineer. Work order issued to patch contractor.',
        officer: 'Er. R. K. Sharma (JE, PWD)',
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        note: 'Maintenance truck #DL-1GC-4412 on site with cold mix bitumen and safety cones.',
        officer: 'Supervisor Manoj Kumar',
      },
    ],
  },

  // Stage 2 Report: Missed initial response deadline (54 hours old, SLA 48h -> Stage 2 Reminder Unlocked)
  {
    id: 'NGK-1027',
    title: 'Non-functional pedestrian crossing signal with exposed wiring',
    description:
      'The automated pedestrian walk signal is dark and hanging loosely from the pole with exposed electrical wiring, creating an accident hazard for office pedestrians crossing to the metro gate.',
    category: 'streetlight',
    status: 'In Review',
    priority: 'high',
    severity_score: 7,
    severity_label: 'High Priority (Pedestrian Hazard)',
    department: 'Delhi Traffic Police & PWD Electrical Wing',
    sla_hours: 48,
    imageUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.6305,
    longitude: 77.208,
    accuracy: 6,
    address: 'Inner Radial Road 2 near Gate 3 Metro, Central Ward',
    location_name: 'Inner Radial Road 2 near Gate 3 Metro, Central Ward',
    ward: 'Ward 42 (Civil Lines / Central)',
    upvotes: 27,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(), // 54h old, SLA 48h -> Stage 2
    reportedBy: 'Citizen_Amit',
    isUserSubmitted: false,
    safety_hazards: [
      'High risk of pedestrian collision with turning city buses',
      'Exposed electrical wire vulnerable to monsoon short-circuiting',
    ],
    administrative_summary:
      'Pedestrian controller unit relay fault identified. Maintenance van dispatched to replace junction box cover.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
        note: 'Report filed with photo verification. PWD Electrical notified.',
        officer: 'NagrikOne AI Bot',
      },
      {
        status: 'In Review',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
        note: 'Junior Engineer conducted electrical hazard assessment.',
        officer: 'Er. Sandeep Tyagi (JE Electrical)',
      },
    ],
  },

  // Stage 3 Report: Escalation deadline passed without resolution (110 hours old, SLA 48h + 48h escalation threshold passed)
  {
    id: 'NGK-1024',
    title: 'Cluster of 4 streetlights dark for five consecutive nights',
    description:
      'Four consecutive pole lights on Lane 8 are dead, leaving a 200m pitch-black stretch. Female commuters and senior citizens feel unsafe walking past the dark park corner.',
    category: 'streetlight',
    status: 'Reported',
    priority: 'high',
    severity_score: 7,
    severity_label: 'High Priority (Night Safety Hazard)',
    department: 'State Electricity Distribution Board (DISCOM) Streetlight Wing',
    sla_hours: 48,
    imageUrl:
      'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.6085,
    longitude: 77.202,
    accuracy: 10,
    address: 'Lane 8, Residential Block B, Greenfield Colony',
    location_name: 'Lane 8, Residential Block B, Greenfield Colony',
    ward: 'Ward 54 (Greenfield)',
    upvotes: 35,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(), // ~4.5 days old -> Stage 3 Escalation Ready
    reportedBy: 'Pooja_K',
    isUserSubmitted: false,
    safety_hazards: [
      'Blind pedestrian corner prone to eve-teasing and theft',
      'Unseen open storm water gutter in darkness',
    ],
    administrative_summary:
      'Feeder pillar circuit breaker tripped or cable cut during underground fiber optic laying.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 110).toISOString(),
        note: 'Ticket logged. Automated SMS dispatch to Area Line Inspector.',
        officer: 'NagrikOne Dispatch',
      },
    ],
  },

  // Stage 4 Report: Unresolved for 15 days (Day 14+ threshold passed -> Stage 4 Public Social Tagging Unlocked)
  {
    id: 'NGK-1022',
    title: 'Overflowing municipal garbage container on pedestrian sidewalk',
    description:
      'Garbage has not been collected for over two weeks. Waste is spilling onto the footpath, causing foul odor, stray cattle gathering, and blocking pedestrian access near the school gate.',
    category: 'garbage_waste',
    status: 'Reported',
    priority: 'medium',
    severity_score: 6,
    severity_label: 'Medium Priority (Hygiene Alert)',
    department: 'Municipal Solid Waste Management Dept (Zone 3)',
    sla_hours: 48,
    imageUrl:
      'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.6355,
    longitude: 77.2144,
    accuracy: 12,
    address: 'Sector 4 Community Market, West Gate',
    location_name: 'Sector 4 Community Market, West Gate',
    ward: 'Ward 18 (Connaught Zone)',
    upvotes: 62,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days old -> Stage 4 Unlocked
    reportedBy: 'Anita_Verma',
    isUserSubmitted: false,
    safety_hazards: [
      'Hygiene hazard for morning school pedestrians',
      'Stray cattle blocking road carriageway',
    ],
    administrative_summary:
      '10-cubic-meter municipal compactor bin at 140% capacity.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        note: 'Citizen report logged with photographic evidence. Sanitary Inspector alerted.',
        officer: 'NagrikOne AI Bot',
      },
    ],
  },

  // Stage 5 Report: Unresolved for 22 days (Day 21+ threshold passed -> Stage 5 RTI Engine Unlocked)
  {
    id: 'NGK-1026',
    title: 'Broken pedestrian sidewalk tiles creating trip hazard for elders',
    description:
      'Over 25 meters of interlocking pavers on the primary shopping corridor have buckled or disintegrated, exposing sharp concrete edges and rebar tips.',
    category: 'public_infrastructure',
    status: 'In Review',
    priority: 'medium',
    severity_score: 5,
    severity_label: 'Medium Priority (Public Infrastructure)',
    department: 'Municipal Corporation Engineering Wing',
    sla_hours: 120,
    imageUrl:
      'https://images.unsplash.com/photo-1584467735815-f778f274e296?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.6145,
    longitude: 77.195,
    accuracy: 9,
    address: 'Commercial Plaza Outer Promenade, Sector 15',
    location_name: 'Commercial Plaza Outer Promenade, Sector 15',
    ward: 'Ward 33 (West Central)',
    upvotes: 27,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(), // 22 days old -> Stage 5 Unlocked
    reportedBy: 'Kavita_Singh',
    isUserSubmitted: false,
    safety_hazards: ['Fall risk for elderly citizens', 'Wheelchair and stroller inaccessibility'],
    administrative_summary:
      'Sidewalk paver substructure collapsed due to tree roots. Estimation submitted for relaying.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 22).toISOString(),
        note: 'Reported by local resident welfare association (RWA).',
        officer: 'Citizen Portal',
      },
      {
        status: 'In Review',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18).toISOString(),
        note: 'Site inspection completed. Estimate sanctioned for precast paver relaying.',
        officer: 'Er. Sandeep Bhati (JE)',
      },
    ],
  },

  // Stage 6 Report: 55 days old, RTI submitted 32 days ago (30-day statutory response period elapsed without adequate response -> Stage 6 Legal Notice Unlocked)
  {
    id: 'NGK-1023',
    title: 'Broken high-pressure water main pipeline flooding road',
    description:
      'Clean treated drinking water is gushing out of an underground supply line break. Water has been pooling across both sides of the street for nearly two months, eroding the road shoulder and causing immense water wastage.',
    category: 'water_drainage',
    status: 'In Progress',
    priority: 'critical',
    severity_score: 9,
    severity_label: 'Critical Priority (Chronic Emergency)',
    department: 'Delhi Jal Board (DJB) Emergency Pipeline Wing',
    sla_hours: 24,
    imageUrl:
      'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.618,
    longitude: 77.2201,
    accuracy: 5,
    address: 'Junction of 3rd Avenue & Park Street, Civil Lines',
    location_name: 'Junction of 3rd Avenue & Park Street, Civil Lines',
    ward: 'Ward 29 (Civil Lines South)',
    upvotes: 94,
    hasUpvoted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55).toISOString(), // 55 days old
    reportedBy: 'Vikram_S',
    isUserSubmitted: false,
    safety_hazards: [
      'Severe loss of potable water supply to 400 households',
      'Road shoulder undermining and sinkhole formation risk',
    ],
    administrative_summary:
      'Main feeder conduit ruptured. Emergency collar clamp temporarily applied but chronic leakage persists.',
    escalationLadder: {
      reminderSent: true,
      reminderSentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
      reminderDeliveryStatus: 'sent',
      escalationFiled: true,
      escalationFiledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
      escalationOfficerType: 'commissioner',
      socialPostDrafted: true,
      socialPostDraftedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString(),
      rtiDrafted: true,
      rtiDraftedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 34).toISOString(),
      rtiSubmitted: true,
      rtiSubmittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(), // 32 days ago (> 30 days elapsed)
      rtiReferenceNumber: 'RTI/DJB/2026/0942',
      rtiSubmissionType: 'citizen_confirmed',
      rtiSubmissionEvidence: 'Submitted on Delhi RTI Portal with fee receipt #DEL-RTI-88319',
      rtiResponsePeriodDays: 30,
      rtiResponseReceived: false,
      rtiResponseStatus: 'no_response',
    },
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 55).toISOString(),
        note: 'Urgent priority ticket triggered. Auto-escalated to Executive Engineer.',
        officer: 'NagrikOne AI System',
      },
      {
        status: 'In Review',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 50).toISOString(),
        note: 'Stage 2 reminder dispatched to Chief Engineer, Delhi Jal Board.',
        officer: 'Citizen Sentinel',
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 32).toISOString(),
        note: 'Stage 5 RTI filed under Sec 6(1) for contractor tender and replacement pipe budget (ACK #RTI/DJB/2026/0942).',
        officer: 'Citizen Representative',
      },
    ],
  },

  // Resolved Report: Escalation ladder ceases progressing; historical audit trail preserved
  {
    id: 'NGK-1025',
    title: 'Blocked stormwater culvert cleared and desilted before monsoon',
    description:
      'The primary drainage culvert beneath Market Road was choked with silt and plastic debris, causing rain runoff backflow into residential basements.',
    category: 'water_drainage',
    status: 'Resolved',
    priority: 'high',
    severity_score: 8,
    severity_label: 'Resolved (Remediated by Municipal Crew)',
    department: 'Municipal Drainage & Flood Control Division',
    sla_hours: 36,
    imageUrl:
      'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
    resolved_proof_url:
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=1200&q=80',
    latitude: 28.641,
    longitude: 77.228,
    accuracy: 7,
    address: 'Opposite Community Hall, Ward 12 Culvert',
    location_name: 'Opposite Community Hall, Ward 12 Culvert',
    ward: 'Ward 12 (North East)',
    upvotes: 81,
    hasUpvoted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
    reportedBy: 'Devendra_Patel',
    isUserSubmitted: false,
    safety_hazards: ['Urban flash flooding risk', 'Mosquito larva incubation in stagnant sludge'],
    administrative_summary:
      'Suction-cum-jetting machine deployed. 4.2 metric tons of silt removed. Runoff restored.',
    timeline: [
      {
        status: 'Reported',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString(),
        note: 'Citizen report submitted with photos of clogged grating.',
        officer: 'Nagrik Dispatcher',
      },
      {
        status: 'In Review',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        note: 'Sanitary Inspector verified blockage depth of 1.4 meters.',
        officer: 'Insp. V. K. Tyagi',
      },
      {
        status: 'In Progress',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        note: 'Super-sucker machine unit #MCD-09 in action.',
        officer: 'Drainage Crew Lead',
      },
      {
        status: 'Resolved',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        note: 'Culvert cleared and photographic completion proof verified by Ward Engineer. Escalation ladder completed and closed.',
        officer: 'Er. A. K. Gupta (Zonal Engineer)',
      },
    ],
  },
];
