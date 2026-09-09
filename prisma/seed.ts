import {
  Agency,
  LeadStatus,
  Priority,
  PrismaClient,
} from "@prisma/client";

const prisma = new PrismaClient();

function daysFromNow(days: number, hours = 10) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

function daysAgo(days: number, hours = 14) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, 0, 0, 0);
  return d;
}

async function main() {
  await prisma.activity.deleteMany();
  await prisma.call.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.note.deleteMany();
  await prisma.client.deleteMany();
  await prisma.task.deleteMany();
  await prisma.poc.deleteMany();
  await prisma.lead.deleteMany();

  const leadsData = [
    {
      company: "Nexus Realty",
      contact: "Priya Mehta",
      phone: "+91 98765 41001",
      email: "priya@nexusrealty.in",
      website: "https://nexusrealty.in",
      linkedin: "https://linkedin.com/in/priyamehta",
      industry: "Real Estate",
      city: "Mumbai",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "UI/UX Design"]),
      budget: 850000,
      source: "Referral",
      priority: Priority.Hot,
      status: LeadStatus.Negotiation,
      notes: "Looking for a property listing platform with CRM integration.",
      nextFollowUp: daysFromNow(0, 11),
    },
    {
      company: "Orbit Labs",
      contact: "Arjun Desai",
      phone: "+91 98200 22110",
      email: "arjun@orbitlabs.io",
      website: "https://orbitlabs.io",
      linkedin: "https://linkedin.com/in/arjundesai",
      industry: "SaaS",
      city: "Bengaluru",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Mobile App"]),
      budget: 1200000,
      source: "LinkedIn",
      priority: Priority.High,
      status: LeadStatus.ProposalSent,
      notes: "Wants a redesign of their analytics dashboard.",
      nextFollowUp: daysFromNow(1, 15),
    },
    {
      company: "Vista Homes",
      contact: "Sneha Kapoor",
      phone: "+91 99870 33441",
      email: "sneha@vistahomes.com",
      website: "https://vistahomes.com",
      industry: "Real Estate",
      city: "Pune",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["XR / VR Experience", "AR Product Demo"]),
      budget: 650000,
      source: "Conference",
      priority: Priority.Hot,
      status: LeadStatus.Discovery,
      notes: "Interested in VR walkthroughs for luxury apartments.",
      nextFollowUp: daysFromNow(0, 16),
    },
    {
      company: "Helix Manufacturing",
      contact: "Rohan Shah",
      phone: "+91 97654 11223",
      email: "rohan@helixmfg.com",
      website: "https://helixmfg.com",
      industry: "Manufacturing",
      city: "Ahmedabad",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["AR Product Demo", "Consulting"]),
      budget: 900000,
      source: "Cold Outreach",
      priority: Priority.High,
      status: LeadStatus.Qualified,
      notes: "AR training modules for factory floor staff.",
      nextFollowUp: daysFromNow(2, 10),
    },
    {
      company: "BrightPath EdTech",
      contact: "Ananya Iyer",
      phone: "+91 98111 55667",
      email: "ananya@brightpath.edu",
      website: "https://brightpath.edu",
      industry: "Education",
      city: "Chennai",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Mobile App"]),
      budget: 450000,
      source: "Website",
      priority: Priority.Medium,
      status: LeadStatus.New,
      notes: "LMS for K-12 coaching institutes.",
      nextFollowUp: daysFromNow(3, 12),
    },
    {
      company: "Coral Hospitality",
      contact: "Vikram Nair",
      phone: "+91 99001 77889",
      email: "vikram@coralhotels.in",
      industry: "Hospitality",
      city: "Goa",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["XR / VR Experience", "Branding"]),
      budget: 500000,
      source: "Partner",
      priority: Priority.Medium,
      status: LeadStatus.ProposalSent,
      notes: "VR lobby experience for flagship resort.",
      nextFollowUp: daysFromNow(4, 14),
    },
    {
      company: "Summit Fintech",
      contact: "Meera Joshi",
      phone: "+91 98700 33445",
      email: "meera@summitfin.com",
      website: "https://summitfin.com",
      linkedin: "https://linkedin.com/in/meerajoshi",
      industry: "Fintech",
      city: "Mumbai",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Consulting"]),
      budget: 1500000,
      source: "Referral",
      priority: Priority.Hot,
      status: LeadStatus.Won,
      notes: "Closed — investor portal rebuild.",
      nextFollowUp: null,
    },
    {
      company: "PixelCraft Studio",
      contact: "Karan Malhotra",
      phone: "+91 98222 66778",
      email: "karan@pixelcraft.studio",
      industry: "Media",
      city: "Delhi",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["XR / VR Experience"]),
      budget: 300000,
      source: "LinkedIn",
      priority: Priority.Low,
      status: LeadStatus.Lost,
      notes: "Budget too low; went with freelancers.",
      nextFollowUp: null,
    },
    {
      company: "GreenLeaf Organics",
      contact: "Divya Reddy",
      phone: "+91 97444 88990",
      email: "divya@greenleaf.in",
      website: "https://greenleaf.in",
      industry: "Retail",
      city: "Hyderabad",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Maintenance"]),
      budget: 280000,
      source: "Website",
      priority: Priority.Medium,
      status: LeadStatus.Qualified,
      notes: "E-commerce + subscription boxes.",
      nextFollowUp: daysFromNow(5, 11),
    },
    {
      company: "AeroSim Training",
      contact: "Captain Rajesh",
      phone: "+91 98123 44556",
      email: "rajesh@aerosim.in",
      industry: "Aviation",
      city: "Bengaluru",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["XR / VR Experience", "Consulting"]),
      budget: 2200000,
      source: "Conference",
      priority: Priority.Hot,
      status: LeadStatus.Negotiation,
      notes: "Flight cabin VR training simulator.",
      nextFollowUp: daysFromNow(1, 9),
    },
    {
      company: "UrbanNest Interiors",
      contact: "Ishita Banerjee",
      phone: "+91 98300 11224",
      email: "ishita@urbannest.co",
      website: "https://urbannest.co",
      industry: "Interior Design",
      city: "Kolkata",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["AR Product Demo", "UI/UX Design"]),
      budget: 400000,
      source: "Referral",
      priority: Priority.High,
      status: LeadStatus.Discovery,
      notes: "AR furniture placement for clients.",
      nextFollowUp: daysFromNow(2, 17),
    },
    {
      company: "Nova Health Clinics",
      contact: "Dr. Amit Kulkarni",
      phone: "+91 98989 22334",
      email: "amit@novahealth.in",
      industry: "Healthcare",
      city: "Pune",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Mobile App", "Maintenance"]),
      budget: 750000,
      source: "Cold Outreach",
      priority: Priority.High,
      status: LeadStatus.New,
      notes: "Patient portal + appointment booking.",
      nextFollowUp: daysFromNow(0, 18),
    },
    {
      company: "Forge Motors",
      contact: "Nikhil Patil",
      phone: "+91 97676 55667",
      email: "nikhil@forgemotors.com",
      website: "https://forgemotors.com",
      industry: "Automotive",
      city: "Chennai",
      agency: Agency.ConstructXR,
      services: JSON.stringify(["AR Product Demo", "XR / VR Experience"]),
      budget: 1100000,
      source: "Partner",
      priority: Priority.Medium,
      status: LeadStatus.Won,
      notes: "Showroom AR configurator delivered.",
      nextFollowUp: null,
    },
    {
      company: "CloudSpan Logistics",
      contact: "Farah Khan",
      phone: "+91 99110 77880",
      email: "farah@cloudspan.in",
      industry: "Logistics",
      city: "Delhi",
      agency: Agency.ConstructDev,
      services: JSON.stringify(["Web Development", "Consulting"]),
      budget: 980000,
      source: "LinkedIn",
      priority: Priority.Medium,
      status: LeadStatus.ProposalSent,
      notes: "Fleet tracking dashboard proposal sent.",
      nextFollowUp: daysFromNow(6, 13),
    },
  ];

  const leads = [];
  for (const data of leadsData) {
    const { contact, phone, email, linkedin, ...leadFields } = data as typeof data & {
      contact: string;
      phone?: string;
      email?: string;
      linkedin?: string;
    };
    const lead = await prisma.lead.create({
      data: {
        ...leadFields,
        linkedin: linkedin && linkedin.includes("/in/") ? null : linkedin ?? null,
        pocs: {
          create: [
            {
              name: contact,
              phone: phone ?? null,
              email: email ?? null,
              linkedin: linkedin && linkedin.includes("/in/") ? linkedin : null,
              isPrimary: true,
            },
          ],
        },
      },
    });
    leads.push(lead);
  }

  const byCompany = Object.fromEntries(leads.map((l) => [l.company, l]));

  // Extra POC on a hot deal to demo multi-contact
  await prisma.poc.create({
    data: {
      leadId: byCompany["Nexus Realty"].id,
      name: "Rahul Verma",
      role: "Head of Product",
      email: "rahul@nexusrealty.in",
      phone: "+91 98765 41002",
      isPrimary: false,
    },
  });

  // Activities, calls, meetings, notes, follow-ups
  await prisma.call.createMany({
    data: [
      {
        leadId: byCompany["Nexus Realty"].id,
        date: daysAgo(2),
        durationMin: 35,
        outcome: "Positive",
        summary: "Discussed listing portal MVP scope and integrations.",
        nextAction: "Send revised proposal with timeline",
      },
      {
        leadId: byCompany["Vista Homes"].id,
        date: daysAgo(1),
        durationMin: 25,
        outcome: "Interested",
        summary: "Walked through VR sample for 3BHK unit.",
        nextAction: "Schedule on-site discovery",
      },
      {
        leadId: byCompany["AeroSim Training"].id,
        date: daysAgo(3),
        durationMin: 45,
        outcome: "Negotiation",
        summary: "Budget alignment call with procurement.",
        nextAction: "Share phased payment plan",
      },
      {
        leadId: byCompany["Orbit Labs"].id,
        date: daysAgo(5),
        durationMin: 20,
        outcome: "Follow-up needed",
        summary: "Quick check-in after proposal send.",
        nextAction: "Answer tech questions from CTO",
      },
    ],
  });

  await prisma.meeting.createMany({
    data: [
      {
        leadId: byCompany["Nexus Realty"].id,
        date: daysAgo(7),
        summary: "Discovery workshop with sales & tech leads.",
        painPoints: "Manual lead assignment, slow listing uploads.",
        requirements: "Role-based CRM, bulk property import, WhatsApp notifications.",
        nextSteps: "Wireframes for CRM module",
      },
      {
        leadId: byCompany["Helix Manufacturing"].id,
        date: daysAgo(4),
        summary: "Factory visit + AR use-case mapping.",
        painPoints: "High training time for new machine operators.",
        requirements: "Tablet AR overlays for 4 machine lines.",
        nextSteps: "Pilot on Line A",
      },
      {
        leadId: byCompany["UrbanNest Interiors"].id,
        date: daysAgo(2),
        summary: "Product demo of AR placement prototype.",
        painPoints: "Clients struggle visualizing furniture scale.",
        requirements: "iOS/Android AR, catalog sync from Shopify.",
        nextSteps: "Quote for catalog importer",
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        leadId: byCompany["Nexus Realty"].id,
        body: "Priya prefers morning calls. Decision maker is the CTO.",
      },
      {
        leadId: byCompany["Summit Fintech"].id,
        body: "Kickoff scheduled for next sprint. Introduced to product owner.",
      },
      {
        leadId: byCompany["Nova Health Clinics"].id,
        body: "Compliance requirements: HIPAA-like data handling for India.",
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        leadId: byCompany["Nexus Realty"].id,
        date: daysFromNow(0, 11),
        time: "11:00",
        priority: Priority.Hot,
        reminder: "Send revised proposal",
        completed: false,
      },
      {
        leadId: byCompany["Vista Homes"].id,
        date: daysFromNow(0, 16),
        time: "16:00",
        priority: Priority.Hot,
        reminder: "Confirm discovery meeting location",
        completed: false,
      },
      {
        leadId: byCompany["Nova Health Clinics"].id,
        date: daysFromNow(0, 18),
        time: "18:00",
        priority: Priority.High,
        reminder: "Intro email with case studies",
        completed: false,
      },
      {
        leadId: byCompany["Orbit Labs"].id,
        date: daysFromNow(1, 15),
        time: "15:00",
        priority: Priority.High,
        reminder: "CTO technical Q&A",
        completed: false,
      },
      {
        leadId: byCompany["AeroSim Training"].id,
        date: daysFromNow(1, 9),
        time: "09:00",
        priority: Priority.Hot,
        reminder: "Share payment plan PDF",
        completed: false,
      },
      {
        leadId: byCompany["GreenLeaf Organics"].id,
        date: daysAgo(1),
        time: "12:00",
        priority: Priority.Medium,
        reminder: "Check if they reviewed the demo",
        completed: true,
      },
    ],
  });

  await prisma.activity.createMany({
    data: [
      {
        leadId: byCompany["Nexus Realty"].id,
        type: "STATUS_CHANGE",
        title: "Moved to Negotiation",
        body: "Status updated from Proposal Sent to Negotiation",
        createdAt: daysAgo(1),
      },
      {
        leadId: byCompany["Nexus Realty"].id,
        type: "CALL",
        title: "Logged call (35 min)",
        body: "Discussed listing portal MVP scope and integrations.",
        createdAt: daysAgo(2),
      },
      {
        leadId: byCompany["Vista Homes"].id,
        type: "CALL",
        title: "Logged call (25 min)",
        body: "Walked through VR sample for 3BHK unit.",
        createdAt: daysAgo(1),
      },
      {
        leadId: byCompany["Summit Fintech"].id,
        type: "STATUS_CHANGE",
        title: "Deal won",
        body: "Status updated to Won — Client created",
        createdAt: daysAgo(10),
      },
      {
        leadId: byCompany["Forge Motors"].id,
        type: "STATUS_CHANGE",
        title: "Deal won",
        body: "Status updated to Won — Client created",
        createdAt: daysAgo(20),
      },
      {
        leadId: byCompany["Orbit Labs"].id,
        type: "NOTE",
        title: "Note added",
        body: "CTO reviewing proposal with design team this week.",
        createdAt: daysAgo(3),
      },
      {
        leadId: byCompany["Helix Manufacturing"].id,
        type: "MEETING",
        title: "Meeting logged",
        body: "Factory visit + AR use-case mapping.",
        createdAt: daysAgo(4),
      },
      {
        leadId: byCompany["UrbanNest Interiors"].id,
        type: "MEETING",
        title: "Meeting logged",
        body: "Product demo of AR placement prototype.",
        createdAt: daysAgo(2),
      },
      {
        leadId: byCompany["AeroSim Training"].id,
        type: "FOLLOW_UP",
        title: "Follow-up scheduled",
        body: "Share phased payment plan",
        createdAt: daysAgo(1),
      },
      {
        leadId: byCompany["Nova Health Clinics"].id,
        type: "NOTE",
        title: "Lead created",
        body: "Inbound from cold outreach sequence.",
        createdAt: daysAgo(0),
      },
    ],
  });

  await prisma.client.createMany({
    data: [
      {
        company: "Summit Fintech",
        leadId: byCompany["Summit Fintech"].id,
        projects: JSON.stringify(["Investor Portal Rebuild"]),
        amountAgreed: 1500000,
        amountCollected: 750000,
        workStatus: "Ongoing",
        services: JSON.stringify(["Web Development", "Consulting"]),
      },
      {
        company: "Forge Motors",
        leadId: byCompany["Forge Motors"].id,
        projects: JSON.stringify(["Showroom AR Configurator"]),
        amountAgreed: 1100000,
        amountCollected: 1100000,
        workStatus: "Completed",
        services: JSON.stringify(["AR Product Demo", "XR / VR Experience"]),
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: "Prepare Nexus Realty proposal deck",
        dueDate: daysFromNow(0, 10),
        priority: Priority.Hot,
        completed: false,
      },
      {
        title: "Record AeroSim demo video",
        dueDate: daysFromNow(2, 12),
        priority: Priority.High,
        completed: false,
      },
      {
        title: "Update ConstructXR case studies page",
        dueDate: daysFromNow(5, 9),
        priority: Priority.Medium,
        completed: false,
      },
      {
        title: "Send invoice to Summit Fintech — milestone 1",
        dueDate: daysFromNow(1, 11),
        priority: Priority.High,
        completed: false,
      },
      {
        title: "Archive PixelCraft Studio lead docs",
        dueDate: daysAgo(2),
        priority: Priority.Low,
        completed: true,
      },
    ],
  });

  console.log(`Seeded ${leads.length} leads and related records.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
