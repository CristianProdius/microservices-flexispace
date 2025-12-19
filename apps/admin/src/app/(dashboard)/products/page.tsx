import { Space } from "@repo/types";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const getData = async (): Promise<Space[]> => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces`
    );
    const data = await res.json();
    return data.spaces || [];
  } catch (error) {
    console.log(error);
    return [];
  }
};

const SpacesPage = async () => {
  const data = await getData();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Spaces</h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default SpacesPage;
