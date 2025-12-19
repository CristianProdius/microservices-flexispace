import { Request, Response } from "express";
import { prisma, Prisma, PricingType, SpaceType, CancellationPolicy } from "@repo/db";
import { producer } from "../utils/kafka.js";

// Get all spaces with search/filter
export const getSpaces = async (req: Request, res: Response) => {
  const {
    city,
    spaceType,
    categorySlug,
    minPrice,
    maxPrice,
    minCapacity,
    amenityIds,
    instantBook,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = "1",
    limit = "12",
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  const where: Prisma.SpaceWhereInput = {
    isActive: true,
    ...(city && {
      city: { contains: city as string, mode: "insensitive" },
    }),
    ...(spaceType && { spaceType: spaceType as SpaceType }),
    ...(categorySlug && { categorySlug: categorySlug as string }),
    ...(minCapacity && { capacity: { gte: parseInt(minCapacity as string) } }),
    ...(instantBook !== undefined && { instantBook: instantBook === "true" }),
    ...((minPrice || maxPrice) && {
      OR: [
        {
          pricePerHour: {
            ...(minPrice && { gte: parseInt(minPrice as string) }),
            ...(maxPrice && { lte: parseInt(maxPrice as string) }),
          },
        },
        {
          pricePerDay: {
            ...(minPrice && { gte: parseInt(minPrice as string) }),
            ...(maxPrice && { lte: parseInt(maxPrice as string) }),
          },
        },
      ],
    }),
  };

  const orderBy: Prisma.SpaceOrderByWithRelationInput = {
    [sortBy as string]: sortOrder,
  };

  const skip = (pageNum - 1) * limitNum;

  const [spaces, total] = await Promise.all([
    prisma.space.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        category: true,
        host: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        amenities: {
          include: {
            amenity: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    }),
    prisma.space.count({ where }),
  ]);

  // Calculate average rating for each space
  const spacesWithRating = await Promise.all(
    spaces.map(async (space) => {
      const avgRating = await prisma.review.aggregate({
        where: { spaceId: space.id },
        _avg: { rating: true },
      });
      return {
        ...space,
        averageRating: avgRating._avg.rating || 0,
        reviewCount: space._count.reviews,
      };
    })
  );

  res.status(200).json({
    spaces: spacesWithRating,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

// Get single space by ID
export const getSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      category: true,
      host: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          hostingSince: true,
        },
      },
      amenities: {
        include: {
          amenity: true,
        },
      },
      availability: true,
      blockedDates: {
        where: {
          date: { gte: new Date() },
        },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Get average rating
  const avgRating = await prisma.review.aggregate({
    where: { spaceId: space.id },
    _avg: { rating: true },
  });

  const reviewCount = await prisma.review.count({
    where: { spaceId: space.id },
  });

  res.status(200).json({
    ...space,
    averageRating: avgRating._avg.rating || 0,
    reviewCount,
  });
};

// Create space (HOST only)
export const createSpace = async (req: Request, res: Response) => {
  const hostId = req.userId!;
  const { amenityIds, ...spaceData } = req.body;

  const space = await prisma.space.create({
    data: {
      ...spaceData,
      hostId,
      amenities: amenityIds
        ? {
            create: amenityIds.map((amenityId: number) => ({ amenityId })),
          }
        : undefined,
    },
    include: {
      category: true,
      amenities: {
        include: { amenity: true },
      },
    },
  });

  producer.send("space.created", { value: { id: space.id, hostId } });

  res.status(201).json(space);
};

// Update space (HOST owner or ADMIN)
export const updateSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Check ownership (unless admin)
  if (existingSpace.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to update this space" });
  }

  const { amenityIds, ...spaceData } = req.body;

  // Update space
  const space = await prisma.space.update({
    where: { id: spaceId },
    data: spaceData,
    include: {
      category: true,
      amenities: {
        include: { amenity: true },
      },
    },
  });

  // Update amenities if provided
  if (amenityIds !== undefined) {
    await prisma.spaceAmenity.deleteMany({
      where: { spaceId },
    });
    if (amenityIds.length > 0) {
      await prisma.spaceAmenity.createMany({
        data: amenityIds.map((amenityId: number) => ({
          spaceId,
          amenityId,
        })),
      });
    }
  }

  producer.send("space.updated", { value: { id: space.id } });

  res.status(200).json(space);
};

// Delete space (HOST owner or ADMIN)
export const deleteSpace = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const userRole = req.user?.role;

  const existingSpace = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!existingSpace) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (existingSpace.hostId !== userId && userRole !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to delete this space" });
  }

  // Soft delete - just mark as inactive
  await prisma.space.update({
    where: { id: spaceId },
    data: { isActive: false },
  });

  producer.send("space.deleted", { value: { id: spaceId } });

  res.status(200).json({ message: "Space deleted successfully" });
};

// Get host's own spaces
export const getMySpaces = async (req: Request, res: Response) => {
  const hostId = req.userId!;

  const spaces = await prisma.space.findMany({
    where: { hostId },
    include: {
      category: true,
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(spaces);
};

// Get/Update space availability
export const getAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);

  const availability = await prisma.availability.findMany({
    where: { spaceId },
    orderBy: { dayOfWeek: "asc" },
  });

  const blockedDates = await prisma.blockedDate.findMany({
    where: {
      spaceId,
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
  });

  res.status(200).json({ availability, blockedDates });
};

export const updateAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const userId = req.userId!;
  const { availability, blockedDates } = req.body;

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  if (space.hostId !== userId && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized" });
  }

  // Update availability
  if (availability) {
    await prisma.availability.deleteMany({ where: { spaceId } });
    await prisma.availability.createMany({
      data: availability.map((a: any) => ({
        spaceId,
        dayOfWeek: a.dayOfWeek,
        startTime: a.startTime,
        endTime: a.endTime,
        isOpen: a.isOpen ?? true,
      })),
    });
  }

  // Update blocked dates
  if (blockedDates) {
    await prisma.blockedDate.deleteMany({
      where: {
        spaceId,
        date: { gte: new Date() },
      },
    });
    await prisma.blockedDate.createMany({
      data: blockedDates.map((d: any) => ({
        spaceId,
        date: new Date(d.date),
        reason: d.reason,
      })),
    });
  }

  res.status(200).json({ message: "Availability updated" });
};

// Check availability for specific dates
export const checkAvailability = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parseInt(id);
  const { startDate, endDate } = req.body;

  const space = await prisma.space.findUnique({
    where: { id: spaceId },
    include: {
      availability: true,
      blockedDates: true,
    },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  // Check blocked dates
  const blockedInRange = space.blockedDates.filter((bd) => {
    const bdDate = new Date(bd.date);
    return bdDate >= start && bdDate <= end;
  });

  if (blockedInRange.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Some dates are blocked",
      blockedDates: blockedInRange,
    });
  }

  // Check existing bookings
  const conflictingBookings = await prisma.booking.findMany({
    where: {
      spaceId,
      status: {
        in: ["PENDING", "APPROVED", "DEPOSIT_PAID"],
      },
      OR: [
        {
          startDateTime: { lte: end },
          endDateTime: { gte: start },
        },
      ],
    },
  });

  if (conflictingBookings.length > 0) {
    return res.status(200).json({
      available: false,
      reason: "Dates conflict with existing bookings",
    });
  }

  res.status(200).json({ available: true });
};
