"use client";

import {
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// TODO: Replace with AddSpace component for FlexiSpace
const AddProduct = () => {
  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle className="mb-4">Add Space</SheetTitle>
        <SheetDescription>
          <p className="text-gray-600">
            Space management coming soon. For now, hosts can add spaces through
            the client app at /host/spaces/new
          </p>
        </SheetDescription>
      </SheetHeader>
    </SheetContent>
  );
};

export default AddProduct;
