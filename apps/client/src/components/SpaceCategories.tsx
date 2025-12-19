"use client";

import {
  Building2,
  DoorOpen,
  Users,
  PartyPopper,
  Heart,
  LayoutGrid,
  Grid3X3,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const spaceTypes = [
  {
    name: "All Spaces",
    icon: <Grid3X3 className="w-5 h-5" />,
    slug: "all",
  },
  {
    name: "Office Desk",
    icon: <LayoutGrid className="w-5 h-5" />,
    slug: "OFFICE_DESK",
  },
  {
    name: "Private Office",
    icon: <DoorOpen className="w-5 h-5" />,
    slug: "PRIVATE_OFFICE",
  },
  {
    name: "Meeting Room",
    icon: <Users className="w-5 h-5" />,
    slug: "MEETING_ROOM",
  },
  {
    name: "Event Venue",
    icon: <PartyPopper className="w-5 h-5" />,
    slug: "EVENT_VENUE",
  },
  {
    name: "Wedding Venue",
    icon: <Heart className="w-5 h-5" />,
    slug: "WEDDING_VENUE",
  },
  {
    name: "Coworking",
    icon: <Building2 className="w-5 h-5" />,
    slug: "COWORKING_SPACE",
  },
];

const SpaceCategories = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const selectedType = searchParams.get("type") || "all";

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("type");
    } else {
      params.set("type", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {spaceTypes.map((type) => (
        <button
          key={type.slug}
          onClick={() => handleChange(type.slug)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            type.slug === selectedType || (type.slug === "all" && !searchParams.get("type"))
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {type.icon}
          {type.name}
        </button>
      ))}
    </div>
  );
};

export default SpaceCategories;
