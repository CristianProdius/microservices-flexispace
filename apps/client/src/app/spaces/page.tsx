import SpaceList from "@/components/SpaceList";

interface SpacesPageProps {
  searchParams: Promise<{
    type?: string;
    city?: string;
    capacity?: string;
    minPrice?: string;
    maxPrice?: string;
    instantBook?: string;
    sort?: string;
  }>;
}

const SpacesPage = async ({ searchParams }: SpacesPageProps) => {
  const params = await searchParams;

  return (
    <div className="">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Browse Spaces</h1>
        <p className="text-gray-600 mt-2">
          Find the perfect workspace, meeting room, or event venue for your needs
        </p>
      </div>

      <SpaceList
        type={params.type}
        city={params.city}
        capacity={params.capacity}
        minPrice={params.minPrice}
        maxPrice={params.maxPrice}
        instantBook={params.instantBook}
        sort={params.sort}
        variant="browse"
      />
    </div>
  );
};

export default SpacesPage;
