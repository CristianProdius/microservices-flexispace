"use client";

import { useCallback, useEffect, useState } from "react";
import useAuthStore from "@/stores/authStore";
import { DashboardPageHeader } from "@/components/dashboard";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import AddCategory from "@/components/AddCategory";
import { Badge } from "@/components/ui/badge";
import {
  normalizeCategoryGroups,
  type NormalizedTaxonomyCategoryGroup,
  type TaxonomyApiResponse,
} from "@/lib/taxonomy";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

const PRODUCT_SERVICE_URL =
  process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || "http://localhost:8000";

const CategoriesPage = () => {
  const { getToken } = useAuthStore();
  const [groups, setGroups] = useState<NormalizedTaxonomyCategoryGroup[]>(() =>
    normalizeCategoryGroups([])
  );
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch(`${PRODUCT_SERVICE_URL}/categories?grouped=true`);
      if (res.ok) {
        const data = (await res.json()) as TaxonomyApiResponse;
        setGroups(normalizeCategoryGroups(data));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) return;

    try {
      const resolvedToken = await getToken();
      if (!resolvedToken) {
        toast.error("Sign in again to delete categories");
        return;
      }

      const res = await fetch(`${PRODUCT_SERVICE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${resolvedToken}` },
      });

      if (res.ok) {
        toast.success("Category deleted");
        // Refetch so we stay in sync with the server (handles parallel admins).
        await fetchCategories();
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Error deleting category");
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border/60 bg-card px-4 py-6 text-sm text-muted-foreground shadow-sm">
        Loading categories...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Categories"
        description="Manage grouped space categories"
        action={
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Add Category
              </Button>
            </SheetTrigger>
            <AddCategory onCreated={fetchCategories} />
          </Sheet>
        }
      />

      {groups.map((group) => (
        <section
          key={group.slug}
          className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm"
        >
          <div className="flex flex-col gap-3 border-b border-border/60 bg-muted/30 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-card-foreground">
                  {group.name}
                </h2>
                <Badge variant="outline">{group.categories.length} categories</Badge>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{group.slug}</p>
            </div>
          </div>

          {group.categories.length > 0 ? (
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4">Category</TableHead>
                  <TableHead className="px-4">Slug</TableHead>
                  <TableHead className="px-4">Description</TableHead>
                  <TableHead className="px-4">Spaces</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.categories.map((category) => (
                  <TableRow key={category.id} className="hover:bg-accent/30">
                    <TableCell className="px-4 py-3 font-medium text-card-foreground">
                      {category.icon ? (
                        <span className="mr-2">{category.icon}</span>
                      ) : null}
                      {category.name}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-muted-foreground">
                      {category.slug}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {category.description || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">
                      {category._count?.spaces ?? 0}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete category ${category.name}`}
                        onClick={() => deleteCategory(category.id)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="px-4 py-8 text-sm text-muted-foreground">
              No categories yet
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default CategoriesPage;
