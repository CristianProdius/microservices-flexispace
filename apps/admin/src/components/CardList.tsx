"use client";

import { Card, CardContent, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

// Placeholder component - needs update for FlexiSpace
const CardList = ({ title }: { title: string }) => {
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">{title}</h1>
      <div className="flex flex-col gap-2">
        <Card className="flex-row items-center justify-between gap-4 p-4">
          <CardContent className="flex-1 p-0">
            <CardTitle className="text-sm font-medium text-gray-400">
              No data available
            </CardTitle>
            <Badge variant="secondary">Coming soon</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardList;
