import { randomBytes } from "node:crypto";
import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "@repo/auth-middleware";

const prisma = new PrismaClient();

// DB-011: Refuse to seed production unless explicitly opted-in. The seed
// plants well-known accounts (admin/demo host/demo user) and reference data;
// running it against a production DB will either wipe rotated admin creds (if
// upsert.update were non-empty) or plant predictable credentials (the bug we
// are fixing). The escape hatch ALLOW_SEED_IN_PRODUCTION=true is meant for a
// first-time bootstrap of a fresh prod DB, paired with ADMIN_SEED_PASSWORD.
const isProduction = process.env.NODE_ENV === "production";
const allowSeedInProduction = process.env.ALLOW_SEED_IN_PRODUCTION === "true";

if (isProduction && !allowSeedInProduction) {
  console.error(
    "[seed] Refusing to run in production (NODE_ENV=production).\n" +
      "       Set ALLOW_SEED_IN_PRODUCTION=true *and* ADMIN_SEED_PASSWORD=...\n" +
      "       to bootstrap a fresh production database, then unset both."
  );
  process.exit(1);
}

/**
 * Resolve the admin seed password.
 *  - Production (with the explicit opt-in): ADMIN_SEED_PASSWORD is REQUIRED.
 *  - Development: if ADMIN_SEED_PASSWORD is unset, generate a strong random
 *    password and print it once so the developer can grab it. (Re-running the
 *    seed re-prints a fresh password but the upsert's empty `update: {}` keeps
 *    the original; the dev should save the first one or set the env var.)
 */
function resolveAdminPassword(): { plain: string; generated: boolean } {
  const provided = process.env.ADMIN_SEED_PASSWORD;
  if (provided && provided.length > 0) {
    return { plain: provided, generated: false };
  }
  if (isProduction) {
    console.error(
      "[seed] ADMIN_SEED_PASSWORD is required when ALLOW_SEED_IN_PRODUCTION=true.\n" +
        "       Refusing to plant a predictable admin password."
    );
    process.exit(1);
  }
  // 24 random bytes => 32 url-safe base64 chars => ~192 bits of entropy.
  const generated = randomBytes(24).toString("base64url");
  return { plain: generated, generated: true };
}

async function main() {
  console.log("Seeding database...");

  const categoryGroups = [
    { name: "Business & Office", slug: "business-office", sortOrder: 1 },
    { name: "Events & Celebrations", slug: "events-celebrations", sortOrder: 2 },
    { name: "Creative & Media", slug: "creative-media", sortOrder: 3 },
    { name: "Retail & Commercial", slug: "retail-commercial", sortOrder: 4 },
    { name: "Sports & Wellness", slug: "sports-wellness", sortOrder: 5 },
    { name: "Industrial & Logistics", slug: "industrial-logistics", sortOrder: 6 },
  ] as const;

  const categories = [
    { name: "Office Desk", slug: "office-desk", groupSlug: "business-office", sortOrder: 1 },
    { name: "Private Office", slug: "private-office", groupSlug: "business-office", sortOrder: 2 },
    {
      name: "Meeting & Training Room",
      slug: "meeting-training-room",
      groupSlug: "business-office",
      sortOrder: 3,
    },
    { name: "Coworking Space", slug: "coworking-space", groupSlug: "business-office", sortOrder: 4 },
    {
      name: "Large Conference Hall",
      slug: "large-conference-hall",
      groupSlug: "business-office",
      sortOrder: 5,
    },
    { name: "Event Venue", slug: "event-venue", groupSlug: "events-celebrations", sortOrder: 1 },
    { name: "Wedding Venue", slug: "wedding-venue", groupSlug: "events-celebrations", sortOrder: 2 },
    { name: "Rooftop Venue", slug: "rooftop-venue", groupSlug: "events-celebrations", sortOrder: 3 },
    {
      name: "Garden / Outdoor Space",
      slug: "garden-outdoor-space",
      groupSlug: "events-celebrations",
      sortOrder: 4,
    },
    {
      name: "Private Party Space",
      slug: "private-party-space",
      groupSlug: "events-celebrations",
      sortOrder: 5,
    },
    {
      name: "Private Function Room",
      slug: "private-function-room",
      groupSlug: "events-celebrations",
      sortOrder: 6,
    },
    {
      name: "Private Dining Room",
      slug: "private-dining-room",
      groupSlug: "events-celebrations",
      sortOrder: 7,
    },
    {
      name: "The VIP Suite / Private Lounge",
      slug: "vip-suite-private-lounge",
      groupSlug: "events-celebrations",
      sortOrder: 8,
    },
    {
      name: "Workshop / Maker Space",
      slug: "workshop-maker-space",
      groupSlug: "creative-media",
      sortOrder: 1,
    },
    {
      name: "Photo & Video Studio",
      slug: "photo-video-studio",
      groupSlug: "creative-media",
      sortOrder: 2,
    },
    { name: "Podcast Studio", slug: "podcast-studio", groupSlug: "creative-media", sortOrder: 3 },
    {
      name: "Dark Kitchen / Cloud Kitchen",
      slug: "dark-kitchen-cloud-kitchen",
      groupSlug: "creative-media",
      sortOrder: 4,
    },
    {
      name: "Private Cinema / Screening Room",
      slug: "private-cinema-screening-room",
      groupSlug: "creative-media",
      sortOrder: 5,
    },
    {
      name: "Gaming / Esports Lounge",
      slug: "gaming-esports-lounge",
      groupSlug: "creative-media",
      sortOrder: 6,
    },
    {
      name: "Retail Store / Shop Front",
      slug: "retail-store-shop-front",
      groupSlug: "retail-commercial",
      sortOrder: 1,
    },
    { name: "Pop-up Store", slug: "pop-up-store", groupSlug: "retail-commercial", sortOrder: 2 },
    { name: "Showroom", slug: "showroom", groupSlug: "retail-commercial", sortOrder: 3 },
    {
      name: "Yoga / Dance Studio",
      slug: "yoga-dance-studio",
      groupSlug: "sports-wellness",
      sortOrder: 1,
    },
    {
      name: "Sport Courts & Fields",
      slug: "sport-courts-fields",
      groupSlug: "sports-wellness",
      sortOrder: 2,
    },
    { name: "Indoor & Fitness", slug: "indoor-fitness", groupSlug: "sports-wellness", sortOrder: 3 },
    { name: "Sporturi de Nișă", slug: "specialty-sports", groupSlug: "sports-wellness", sortOrder: 4 },
    {
      name: "Micro-Warehouse / Storage",
      slug: "micro-warehouse-storage",
      groupSlug: "industrial-logistics",
      sortOrder: 1,
    },
    {
      name: "Warehouse / Storage Unit",
      slug: "warehouse-storage-unit",
      groupSlug: "industrial-logistics",
      sortOrder: 2,
    },
    {
      name: "Distribution Center",
      slug: "distribution-center",
      groupSlug: "industrial-logistics",
      sortOrder: 3,
    },
    { name: "Cold Storage", slug: "cold-storage", groupSlug: "industrial-logistics", sortOrder: 4 },
    { name: "Big Box Retail", slug: "big-box-retail", groupSlug: "industrial-logistics", sortOrder: 5 },
    {
      name: "Light Industrial / Workshop",
      slug: "light-industrial-workshop",
      groupSlug: "industrial-logistics",
      sortOrder: 6,
    },
  ] as const;

  for (const group of categoryGroups) {
    await prisma.spaceCategoryGroup.upsert({
      where: { slug: group.slug },
      update: {
        name: group.name,
        sortOrder: group.sortOrder,
      },
      create: group,
    });
  }
  console.log("✓ Category groups created");

  const legacyMeetingRoom = await prisma.spaceCategory.findUnique({
    where: { slug: "meeting-room" },
    select: { id: true },
  });
  if (legacyMeetingRoom) {
    await prisma.spaceCategory.upsert({
      where: { slug: "meeting-training-room" },
      update: {
        description: null,
        group: { connect: { slug: "business-office" } },
        icon: null,
        name: "Meeting & Training Room",
        sortOrder: 3,
      },
      create: {
        description: null,
        group: { connect: { slug: "business-office" } },
        icon: null,
        name: "Meeting & Training Room",
        slug: "meeting-training-room",
        sortOrder: 3,
      },
    });

    await prisma.space.updateMany({
      where: { categorySlug: "meeting-room" },
      data: { categorySlug: "meeting-training-room" },
    });

    await prisma.spaceCategory.delete({
      where: { id: legacyMeetingRoom.id },
    });
  }

  for (const category of categories) {
    await prisma.spaceCategory.upsert({
      where: { slug: category.slug },
      update: {
        description: null,
        group: { connect: { slug: category.groupSlug } },
        icon: null,
        name: category.name,
        sortOrder: category.sortOrder,
      },
      create: {
        description: null,
        group: { connect: { slug: category.groupSlug } },
        icon: null,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
    });
  }
  console.log("✓ Categories created");

  // Create Amenities
  const amenities = [
    // Basic
    { name: "WiFi", icon: "wifi", category: "Basic" },
    { name: "Air Conditioning", icon: "thermometer", category: "Basic" },
    { name: "Heating", icon: "flame", category: "Basic" },
    { name: "Parking", icon: "car", category: "Basic" },
    { name: "Wheelchair Accessible", icon: "accessibility", category: "Basic" },

    // Tech
    { name: "Projector", icon: "monitor", category: "Tech" },
    { name: "TV Screen", icon: "tv", category: "Tech" },
    { name: "Video Conferencing", icon: "video", category: "Tech" },
    { name: "Whiteboard", icon: "edit", category: "Tech" },
    { name: "Printer", icon: "printer", category: "Tech" },

    // Comfort
    { name: "Kitchen", icon: "utensils", category: "Comfort" },
    { name: "Coffee/Tea", icon: "coffee", category: "Comfort" },
    { name: "Lounge Area", icon: "sofa", category: "Comfort" },
    { name: "Outdoor Space", icon: "tree", category: "Comfort" },
    { name: "Reception", icon: "bell", category: "Comfort" },

    // Security
    { name: "24/7 Access", icon: "clock", category: "Security" },
    { name: "Security System", icon: "shield", category: "Security" },
    { name: "Lockers", icon: "lock", category: "Security" },
  ];

  for (const amenity of amenities) {
    await prisma.amenity.upsert({
      where: { name: amenity.name },
      update: {},
      create: amenity,
    });
  }
  console.log("✓ Amenities created");

  // Create Admin User. The plaintext password is sourced from
  // ADMIN_SEED_PASSWORD; in development we generate a random one and print it
  // once. upsert.update is intentionally empty so re-seeding NEVER clobbers a
  // rotated production password.
  const adminEmail = process.env.ADMIN_SEED_EMAIL || "admin@spacefly.ai";
  const { plain: adminPlain, generated: adminGenerated } = resolveAdminPassword();
  const adminPassword = await hashPassword(adminPlain);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: "admin",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });
  if (adminGenerated) {
    console.log(
      "\n========================================================================\n" +
        " GENERATED ADMIN PASSWORD (save it now — it will NOT be shown again):\n" +
        `   email:    ${adminEmail}\n` +
        `   password: ${adminPlain}\n` +
        " Set ADMIN_SEED_PASSWORD in your .env to make this stable across re-seeds.\n" +
        "========================================================================\n"
    );
  } else {
    console.log(`✓ Admin user created (${adminEmail} / password from ADMIN_SEED_PASSWORD)`);
  }

  // Demo accounts are dev-only fixtures used by the demo Spaces below.
  // They are skipped in production (even with ALLOW_SEED_IN_PRODUCTION=true)
  // because they ship with hardcoded passwords and serve no production use.
  let host: Awaited<ReturnType<typeof prisma.user.upsert>> | null = null;
  if (!isProduction) {
    const hostPassword = await hashPassword("host123");
    host = await prisma.user.upsert({
      where: { email: "host@spacefly.ai" },
      update: {},
      create: {
        email: "host@spacefly.ai",
        username: "demohost",
        name: "Demo Host",
        password: hostPassword,
        role: "HOST",
        emailVerified: true,
        hostVerified: true,
        hostingSince: new Date(),
        bio: "Professional space provider with multiple venues",
      },
    });
    console.log("✓ Demo host created (host@spacefly.ai / host123)");

    const userPassword = await hashPassword("user123");
    await prisma.user.upsert({
      where: { email: "user@spacefly.ai" },
      update: {},
      create: {
        email: "user@spacefly.ai",
        username: "demouser",
        name: "Demo User",
        password: userPassword,
        role: "USER",
        emailVerified: true,
      },
    });
    console.log("✓ Demo user created (user@spacefly.ai / user123)");
  } else {
    console.log("✓ Skipping demo host/user fixtures (production seed)");
  }

  // Demo Spaces are dev-only fixtures that hang off the demo host. Skip them
  // entirely when there is no demo host (i.e. in production).
  if (!host) {
    console.log("\n✅ Database seeding completed!");
    return;
  }

  // Create Demo Spaces
  const demoSpaces = [
    {
      name: "Downtown Creative Studio",
      shortDescription: "Modern creative workspace in the heart of downtown",
      description: "A beautifully designed creative studio perfect for photo shoots, workshops, and small events. Features natural lighting, exposed brick walls, and modern amenities.",
      spaceType: "EVENT_VENUE" as const,
      pricingType: "BOTH" as const,
      pricePerHour: 50, // $50/hour
      pricePerDay: 300, // $300/day
      capacity: 30,
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
      images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
      categorySlug: "event-venue",
      hostId: host.id,
    },
    {
      name: "Executive Meeting Room",
      shortDescription: "Professional meeting room for up to 12 people",
      description: "Fully equipped executive meeting room with video conferencing, presentation tools, and comfortable seating. Perfect for board meetings and client presentations.",
      spaceType: "MEETING_ROOM" as const,
      pricingType: "HOURLY" as const,
      pricePerHour: 75, // $75/hour
      capacity: 12,
      address: "456 Business Ave",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10002",
      latitude: 40.7549,
      longitude: -73.9840,
      images: ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"],
      categorySlug: "meeting-training-room",
      hostId: host.id,
    },
    {
      name: "Private Corner Office",
      shortDescription: "Quiet private office with city views",
      description: "A serene private office space perfect for focused work. Features a standing desk option, ergonomic chair, and stunning city views.",
      spaceType: "PRIVATE_OFFICE" as const,
      pricingType: "DAILY" as const,
      pricePerDay: 150, // $150/day
      capacity: 4,
      address: "789 Tower Plaza",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      postalCode: "90001",
      latitude: 34.0522,
      longitude: -118.2437,
      images: ["https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800"],
      categorySlug: "private-office",
      hostId: host.id,
    },
    {
      name: "Open Coworking Hub",
      shortDescription: "Vibrant coworking space with community vibes",
      description: "Join our thriving community of remote workers and entrepreneurs. Includes high-speed WiFi, unlimited coffee, and networking events.",
      spaceType: "COWORKING_SPACE" as const,
      pricingType: "BOTH" as const,
      pricePerHour: 15, // $15/hour
      pricePerDay: 50, // $50/day
      capacity: 50,
      address: "321 Innovation Blvd",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94102",
      latitude: 37.7749,
      longitude: -122.4194,
      images: ["https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=800"],
      categorySlug: "coworking-space",
      hostId: host.id,
    },
    {
      name: "Garden Wedding Venue",
      shortDescription: "Romantic outdoor venue for your special day",
      description: "A stunning garden venue perfect for weddings and celebrations. Features beautiful landscaping, outdoor ceremony space, and indoor reception hall.",
      spaceType: "WEDDING_VENUE" as const,
      pricingType: "DAILY" as const,
      pricePerDay: 5000, // $5000/day
      capacity: 150,
      address: "555 Garden Lane",
      city: "Miami",
      state: "FL",
      country: "USA",
      postalCode: "33101",
      latitude: 25.7617,
      longitude: -80.1918,
      images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800"],
      categorySlug: "wedding-venue",
      hostId: host.id,
    },
  ];

  for (const spaceData of demoSpaces) {
    const venue = await prisma.venue.create({
      data: {
        name: `${spaceData.name} Venue`,
        shortDescription: spaceData.shortDescription,
        description: spaceData.description,
        images: spaceData.images,
        address: spaceData.address,
        city: spaceData.city,
        state: spaceData.state,
        country: spaceData.country,
        postalCode: spaceData.postalCode,
        latitude: spaceData.latitude,
        longitude: spaceData.longitude,
        hostId: spaceData.hostId,
      },
    });

    // Location lives on Venue (DB-010); strip the legacy duplicates before
    // passing the rest to Space.create.
    const {
      address: _address,
      city: _city,
      state: _state,
      country: _country,
      postalCode: _postalCode,
      latitude: _latitude,
      longitude: _longitude,
      ...spaceCreate
    } = spaceData;

    const space = await prisma.space.create({
      data: {
        ...spaceCreate,
        venueId: venue.id,
      },
    });

    // Add some amenities to each space
    const allAmenities = await prisma.amenity.findMany();
    const randomAmenities = allAmenities.slice(0, 8); // First 8 amenities

    for (const amenity of randomAmenities) {
      await prisma.spaceAmenity.create({
        data: {
          spaceId: space.id,
          amenityId: amenity.id,
        },
      });
    }

    // Add availability (Mon-Fri 9am-6pm)
    for (let day = 1; day <= 5; day++) {
      await prisma.availability.create({
        data: {
          spaceId: space.id,
          dayOfWeek: day,
          startTime: "09:00",
          endTime: "18:00",
          isOpen: true,
        },
      });
    }
  }
  console.log("✓ Demo spaces created with amenities and availability");

  console.log("\n✅ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
