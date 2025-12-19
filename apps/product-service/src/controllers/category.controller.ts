import { Prisma, prisma } from "@repo/db";
import { Request, Response } from "express";

export const createCategory = async (req: Request, res: Response) => {
  const data: Prisma.SpaceCategoryCreateInput = req.body;

  // Auto-generate slug if not provided
  if (!data.slug) {
    data.slug = data.name.toLowerCase().replace(/\s+/g, "-");
  }

  const category = await prisma.spaceCategory.create({ data });
  res.status(201).json(category);
};

export const updateCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);
  const data: Prisma.SpaceCategoryUpdateInput = req.body;

  const category = await prisma.spaceCategory.update({
    where: { id: categoryId },
    data,
  });

  return res.status(200).json(category);
};

export const deleteCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);

  // Check if category has spaces by slug
  const category = await prisma.spaceCategory.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  const spacesCount = await prisma.space.count({
    where: { categorySlug: category.slug },
  });

  if (spacesCount > 0) {
    return res.status(400).json({
      message: `Cannot delete category with ${spacesCount} spaces. Please reassign or delete those spaces first.`,
    });
  }

  await prisma.spaceCategory.delete({
    where: { id: categoryId },
  });

  return res.status(200).json({ message: "Category deleted" });
};

export const getCategories = async (req: Request, res: Response) => {
  const categories = await prisma.spaceCategory.findMany({
    include: {
      _count: {
        select: { spaces: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return res.status(200).json(categories);
};

export const getCategory = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const categoryId = parseInt(id);

  const category = await prisma.spaceCategory.findUnique({
    where: { id: categoryId },
    include: {
      _count: {
        select: { spaces: true },
      },
    },
  });

  if (!category) {
    return res.status(404).json({ message: "Category not found" });
  }

  return res.status(200).json(category);
};
