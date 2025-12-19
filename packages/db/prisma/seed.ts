import { PrismaClient } from "../generated/prisma";
import { hashPassword } from "@repo/auth-middleware";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create Space Categories
  const categories = [
    { name: "Office Desk", slug: "office-desk", description: "Individual desks in shared workspaces", icon: "desk" },
    { name: "Private Office", slug: "private-office", description: "Enclosed private offices for teams", icon: "building" },
    { name: "Meeting Room", slug: "meeting-room", description: "Conference and meeting rooms", icon: "users" },
    { name: "Event Venue", slug: "event-venue", description: "Venues for corporate events and parties", icon: "calendar" },
    { name: "Wedding Venue", slug: "wedding-venue", description: "Beautiful venues for weddings", icon: "heart" },
    { name: "Coworking Space", slug: "coworking-space", description: "Open coworking areas", icon: "laptop" },
  ];

  for (const category of categories) {
    await prisma.spaceCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
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

  // Create Admin User
  const adminPassword = await hashPassword("admin123");
  await prisma.user.upsert({
    where: { email: "admin@flexispace.com" },
    update: {},
    create: {
      email: "admin@flexispace.com",
      username: "admin",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log("✓ Admin user created (admin@flexispace.com / admin123)");

  // Create Demo Host User
  const hostPassword = await hashPassword("host123");
  const host = await prisma.user.upsert({
    where: { email: "host@flexispace.com" },
    update: {},
    create: {
      email: "host@flexispace.com",
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
  console.log("✓ Demo host created (host@flexispace.com / host123)");

  // Create Demo User
  const userPassword = await hashPassword("user123");
  await prisma.user.upsert({
    where: { email: "user@flexispace.com" },
    update: {},
    create: {
      email: "user@flexispace.com",
      username: "demouser",
      name: "Demo User",
      password: userPassword,
      role: "USER",
      emailVerified: true,
    },
  });
  console.log("✓ Demo user created (user@flexispace.com / user123)");

  // Create Demo Spaces
  const demoSpaces = [
    {
      name: "Downtown Creative Studio",
      shortDescription: "Modern creative workspace in the heart of downtown",
      description: "A beautifully designed creative studio perfect for photo shoots, workshops, and small events. Features natural lighting, exposed brick walls, and modern amenities.",
      spaceType: "EVENT_VENUE" as const,
      pricingType: "BOTH" as const,
      pricePerHour: 5000, // $50/hour
      pricePerDay: 30000, // $300/day
      capacity: 30,
      address: "123 Main Street",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10001",
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
      pricePerHour: 7500, // $75/hour
      capacity: 12,
      address: "456 Business Ave",
      city: "New York",
      state: "NY",
      country: "USA",
      postalCode: "10002",
      images: ["https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800"],
      categorySlug: "meeting-room",
      hostId: host.id,
    },
    {
      name: "Private Corner Office",
      shortDescription: "Quiet private office with city views",
      description: "A serene private office space perfect for focused work. Features a standing desk option, ergonomic chair, and stunning city views.",
      spaceType: "PRIVATE_OFFICE" as const,
      pricingType: "DAILY" as const,
      pricePerDay: 15000, // $150/day
      capacity: 4,
      address: "789 Tower Plaza",
      city: "Los Angeles",
      state: "CA",
      country: "USA",
      postalCode: "90001",
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
      pricePerHour: 1500, // $15/hour
      pricePerDay: 5000, // $50/day
      capacity: 50,
      address: "321 Innovation Blvd",
      city: "San Francisco",
      state: "CA",
      country: "USA",
      postalCode: "94102",
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
      pricePerDay: 500000, // $5000/day
      capacity: 150,
      address: "555 Garden Lane",
      city: "Miami",
      state: "FL",
      country: "USA",
      postalCode: "33101",
      images: ["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800"],
      categorySlug: "wedding-venue",
      hostId: host.id,
    },
  ];

  for (const spaceData of demoSpaces) {
    const space = await prisma.space.create({
      data: spaceData,
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
