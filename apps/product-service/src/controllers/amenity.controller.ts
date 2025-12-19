import { Prisma, prisma } from "@repo/db";
import { Request, Response } from "express";

export const createAmenity = async (req: Request, res: Response) => {
  const data: Prisma.AmenityCreateInput = req.body;

  const amenity = await prisma.amenity.create({ data });
  res.status(201).json(amenity);
};

export const updateAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id);
  const data: Prisma.AmenityUpdateInput = req.body;

  const amenity = await prisma.amenity.update({
    where: { id: amenityId },
    data,
  });

  return res.status(200).json(amenity);
};

export const deleteAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id);

  // First remove from all spaces
  await prisma.spaceAmenity.deleteMany({
    where: { amenityId },
  });

  const amenity = await prisma.amenity.delete({
    where: { id: amenityId },
  });

  return res.status(200).json(amenity);
};

export const getAmenities = async (req: Request, res: Response) => {
  const { category } = req.query;

  const amenities = await prisma.amenity.findMany({
    where: category
      ? {
          category: category as string,
        }
      : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return res.status(200).json(amenities);
};

export const getAmenity = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const amenityId = parseInt(id);

  const amenity = await prisma.amenity.findUnique({
    where: { id: amenityId },
  });

  if (!amenity) {
    return res.status(404).json({ message: "Amenity not found" });
  }

  return res.status(200).json(amenity);
};
