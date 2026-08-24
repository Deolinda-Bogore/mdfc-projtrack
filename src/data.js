export const roles = {
  director: {
    label: 'Director',
    name: 'Executive Director',
    description: 'Executive view',
    initials: 'ED',
  },
  manager: {
    label: 'Manager',
    name: 'Programs Manager',
    description: 'Programs and team',
    initials: 'PM',
  },
  employee: {
    label: 'Initiator',
    name: 'Request Initiator',
    description: 'Submit and follow requests',
    initials: 'RI',
  },
  finance: {
    label: 'Finance',
    name: 'Finance Director',
    description: 'Review and verification',
    initials: 'FD',
  },
  administration: {
    label: 'Administration',
    name: 'Administration',
    description: 'Operations and assets',
    initials: 'AD',
  },
};

export const navigation = {
  director: [
    ['dashboard', 'Director Dashboard'],
    ['programs', 'Programs'],
    ['finance', 'Finance'],
    ['administration', 'Administration'],
    ['approvals', 'Approvals'],
    ['reports', 'Reports'],
    ['documents', 'Documents'],
    ['users', 'Users'],
  ],
  manager: [
    ['dashboard', 'Dashboard'],
    ['programs', 'Programs'],
    ['tasks', 'Task Board'],
    ['requests', 'Activity Requests'],
    ['administration', 'Administration'],
    ['evidence', 'M&E Evidence'],
    ['grants', 'Grants Database'],
    ['documents', 'Documents'],
    ['users', 'Users'],
  ],
  employee: [
    ['dashboard', 'My Dashboard'],
    ['tasks', 'My Tasks'],
    ['requests', 'Submit Request'],
    ['evidence', 'M&E Evidence'],
    ['documents', 'Documents'],
    ['worklog', 'My Work Log'],
  ],
  administration: [
    ['dashboard', 'Administration Dashboard'],
    ['administration', 'Administration'],
    ['requests', 'Submit Request'],
    ['documents', 'Documents'],
    ['reports', 'Reports'],
  ],
  finance: [
    ['finance', 'Finance Dashboard'],
    ['requests', 'Review Requests'],
    ['budget', 'Budget Management'],
    ['procurement', 'Procurement'],
    ['payments', 'Payments'],
    ['audit', 'Audit Trail'],
    ['documents', 'Documents'],
  ],
};

export const systemBranches = [
  {
    id: 'programs',
    title: 'Programs',
    subtitle: 'Project management',
    items: [
      'Add projects from application or proposal work plans.',
      'Assign tasks to project leads and implementors.',
      'Track activities, timelines, outputs, remarks, challenges, and comments.',
      'Capture M&E data, testimonials, videos, attachments, indicators, and survey results.',
      'Maintain grants database with grant name, funder, owner, link, progress, and remarks.',
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    subtitle: 'Requisition and budget monitoring',
    items: [
      'Create smart requisitions with automatic numbers, attachments, comments, and status.',
      'Manage budgets, actual expenditure, remaining balance, forecasting, and adjustments.',
      'Route requests through finance verification, executive approval, and board approval when needed.',
      'Process payments, payment vouchers, cash advances, receipts, and accountabilities.',
      'Connect every finance action to project, donor, budget line, user, approval history, documents, and audit trail.',
    ],
  },
  {
    id: 'administration',
    title: 'Administration',
    subtitle: 'Daily operations',
    items: [
      'Track monthly operations such as rent, taxes, subscriptions, amount, responsible person, and due date.',
      'Manage asset register with category, item, responsible person, contact, status, and documents.',
      'Maintain vendors and suppliers with contracts, timeline, telephone, account number, and category.',
      'Keep HR records, contracts, attendance, performance, training, and payroll notes.',
      'Track inventory, travel records, vehicles, renewals, administrative contracts, and reports.',
    ],
  },
];

export const priorityReports = [
  ['project-dashboard', 'Project Dashboard'],
  ['workplan-activity-status', 'Project Workplan & Activity Status Report'],
  ['meal-indicator-performance', 'MEAL/Indicator Performance Report'],
  ['budget-vs-expenditure', 'Budget vs. Expenditure Report'],
  ['beneficiary-reach', 'Beneficiary/Reach Report'],
  ['risk-issues', 'Risk & Issues Report'],
  ['staff-task-accountability', 'Staff Task & Accountability Report'],
  ['donor-narrative-reporting', 'Donor/Narrative Reporting Report'],
];

export const projects = [
  {
    id: 1,
    title: 'Digital Service Platform',
    donor: 'Digital health donor',
    owner: 'Project Lead',
    status: 'Active',
    budget: 1200000,
    spent: 980000,
    progress: 78,
    workPlan: 'Application work plan attached',
    budgetDetails: 'Technology, hosting, database, and user testing',
    results: 'Improve access to reliable digital service information.',
    narrative: 'A web-based platform for service information, internal tracking, and field support workflows.',
    activities: ['Platform improvement', 'User testing', 'Staff demo'],
  },
  {
    id: 2,
    title: 'Program Data Dashboard',
    donor: 'Research partner',
    owner: 'M&E Officer',
    status: 'Active',
    budget: 850000,
    spent: 520000,
    progress: 58,
    workPlan: 'Proposal work plan attached',
    budgetDetails: 'Monitoring, reporting, data tools, and validation sessions',
    results: 'Make program progress visible through indicators and reports.',
    narrative: 'M&E dashboard connecting data collection to management reporting.',
    activities: ['Indicator review', 'Data cleaning', 'Narrative report'],
  },
  {
    id: 3,
    title: 'Community Outreach Tool',
    donor: 'Institutional donor',
    owner: 'Implementor',
    status: 'Planning',
    budget: 600000,
    spent: 120000,
    progress: 25,
    workPlan: 'Draft work plan',
    budgetDetails: 'Mobile forms, field data, and training support',
    results: 'Track outreach activities, referrals, and follow-ups.',
    narrative: 'Mobile-friendly activity tracking for project teams.',
    activities: ['Training session', 'Referral tracking', 'Field feedback'],
  },
];

export const tasks = [
  {
    id: 1,
    projectId: 1,
    title: 'Design activity request form UI',
    assignee: 'Implementor',
    status: 'Done',
    priority: 'High',
    due: '2026-08-08',
    inputs: 'Request fields, approval stages, documents',
    outputs: 'Clickable form design',
    indicators: 'Form covers required requisition details',
    meansOfVerification: 'Demo screenshots and review notes',
    attachments: 'Design file',
    remarks: 'Ready for review',
    challenges: 'Need staff validation',
  },
  {
    id: 2,
    projectId: 1,
    title: 'Build request approval prototype',
    assignee: 'Implementor',
    status: 'In Progress',
    priority: 'High',
    due: '2026-08-12',
    inputs: 'Finance workflow and budget rules',
    outputs: 'Approval flow prototype',
    indicators: 'Status changes after each approval',
    meansOfVerification: 'Demo walkthrough',
    attachments: 'Prototype link',
    remarks: 'Finance logic started',
    challenges: 'Need final approval levels confirmed',
  },
  {
    id: 3,
    projectId: 2,
    title: 'Prepare narrative report fields',
    assignee: 'M&E Officer',
    status: 'Review',
    priority: 'Medium',
    due: '2026-08-15',
    inputs: 'Survey results and documentary evidence',
    outputs: 'M&E reporting form',
    indicators: 'Report links evidence to activity',
    meansOfVerification: 'Uploaded report and survey file',
    attachments: 'Narrative report draft',
    remarks: 'Needs comments',
    challenges: 'Some evidence pending',
  },
];

export const requests = [
  {
    id: 1,
    code: 'REQ-OPS-001',
    requestDate: '2026-08-04',
    requestingTitle: 'Administrative Assistant',
    department: 'Administration',
    project: 'Operations Support',
    donor: 'Core funds',
    budgetLine: 'Organisational costs',
    particularActivity: 'Office equipment support',
    item: 'Computer equipment',
    details: 'Purchasing equipment for an internal support role.',
    amount: 650000,
    documents: 'Purchase request, quotation, approval memo',
    status: 'Submitted',
    preparedBy: 'Administrative Assistant',
    verifiedBy: 'Finance Director',
    executiveApproval: 'Pending',
    boardApproval: 'Pending',
    comments: 'Supporting documents should be complete before payment.',
    recommendations: 'Attach signed minutes and contract where needed.',
    spentAmount: 0,
    referenceNo: 'Pending',
    variance: 0,
  },
  {
    id: 2,
    code: 'REQ-ACT-002',
    requestDate: '2026-08-05',
    requestingTitle: 'Finance Assistant Intern',
    department: 'Programs',
    project: 'Partner Event Coordination',
    donor: 'Health partner',
    budgetLine: 'Project activities',
    particularActivity: 'Partner launch event',
    item: 'Transportation and facilitation fees',
    details: 'Transportation and facilitation support for a coordination team event.',
    amount: 195000,
    documents: 'Attendance list, activity budget, payment list',
    status: 'Approved',
    preparedBy: 'Finance Assistant Intern',
    verifiedBy: 'Finance Director',
    executiveApproval: 'Approved',
    boardApproval: 'Approved',
    comments: 'Payment source confirmed and request is ready for approval.',
    recommendations: 'Ready for payment processing.',
    spentAmount: 195000,
    referenceNo: 'PAY-REF-002',
    variance: 0,
  },
];

export const budgets = [
  ['Digital Service Platform', 'Digital health donor', 'Technology', 'Digital systems', 1200000, 980000, 220000, 1120000, 'Within budget'],
  ['Program Data Dashboard', 'Research partner', 'M&E', 'Monitoring and evaluation', 850000, 520000, 330000, 760000, 'Watch forecast'],
  ['Community Outreach Tool', 'Institutional donor', 'Activities', 'Project activities', 600000, 120000, 480000, 570000, 'Healthy'],
];

export const suppliers = [
  ['Approved IT Supplier', 'IT', 'Operations Contact', '078 *** 0301', 'supplier@example.org', '2026-12-31', 'Active', 'IT contract.pdf'],
  ['Catering Partner', 'Catering', 'Events Contact', '078 *** 0302', 'catering@example.org', '2026-09-30', 'Renewal due', 'Price list.pdf'],
  ['Transport Provider', 'Transport', 'Logistics Contact', '078 *** 0303', 'transport@example.org', '2027-02-14', 'Active', 'Route rates.pdf'],
];

export const payments = [
  ['PAY-REF-001', 'Administrative supplier', 'Operations Support', 'Core funds', 'Organisational costs', 650000, 'Bank transfer', 'Pending'],
  ['PAY-REF-002', 'Participant payment batch', 'Partner Event Coordination', 'Health partner', 'Project activities', 195000, 'Mobile money', 'Paid'],
];

export const adminOperations = [
  ['Office rent', 450000, 'Administrative Assistant', '25th of each month', 'Monthly operation', 'Bank transfer'],
  ['Taxes', 150000, 'Finance Director', '15th of each month', 'Statutory filing', 'Bank transfer'],
  ['Monthly subscriptions', 85000, 'Administration', 'Monthly renewal', 'Internet and service tools', 'Card / transfer'],
];

export const assets = [
  ['Electronic devices', 'Laptops and accessories', 'Administration', 'admin@mdfc.rw', 'Assigned', 'Asset handover form'],
  ['Office equipment', 'Printer and meeting equipment', 'Administration', 'admin@mdfc.rw', 'In use', 'Purchase receipt'],
];

export const inventory = [
  ['Laptop', 'Electronic device', 5, 'Programs team', 'Office', 'In use'],
  ['Projector', 'Office equipment', 1, 'Administration', 'Meeting room', 'Available'],
  ['Stationery pack', 'Office supplies', 40, 'General store', 'Storage', 'Low stock'],
];

export const travel = [
  ['Vehicle 01', 'Field activity', 'Project team', 'District field site', '2026-08-14', 'Scheduled'],
  ['Hired transport', 'Training logistics', 'Training team', 'Partner venue', '2026-08-18', 'Pending approval'],
];

export const hr = [
  ['Employee 01', 'Project Lead', 'Programs', 'Active', 'Monthly', 'Timesheet submitted'],
  ['Employee 02', 'Administrative Assistant', 'Administration', 'Active', 'Monthly', 'Handles monthly operations'],
  ['Intern 01', 'Software / IT Intern', 'Digital Innovation', 'Internship', 'Allowance / N/A', 'PMS implementation support'],
];

export const evidence = [
  ['Community Outreach Tool', 'Training session', 'Attendance and participant list', '2 testimonial notes', 'Short activity video', 'Pre/post survey results', 'Uploaded'],
  ['Program Data Dashboard', 'M&E review', 'Indicator dataset', 'Program feedback notes', 'Narrative report draft', 'Validation checklist', 'Review'],
];

export const grants = [
  ['Digital Health Support Grant', 'Partner funder', 'Programs + M&E', 'Workplan link', 'Inputs and outputs tracked', 'Narrative report pending'],
  ['Community Outreach Grant', 'Institutional donor', 'Project Lead', 'Dashboard link', 'Activities underway', 'Survey results attached'],
];

export const auditTrail = [
  ['2026-08-05 09:10', 'Administrative Assistant', 'Created requisition', 'REQ-OPS-001', 'Operations Support', 'Core funds', 'Organisational costs', 'Archived'],
  ['2026-08-05 09:40', 'Finance Director', 'Verified budget availability', 'REQ-ACT-002', 'Partner Event Coordination', 'Health partner', 'Project activities', 'Logged'],
  ['2026-08-05 10:05', 'Executive Director', 'Approved request', 'REQ-ACT-002', 'Partner Event Coordination', 'Health partner', 'Project activities', 'Logged'],
];
