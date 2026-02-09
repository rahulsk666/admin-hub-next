import React from "react";
import { Skeleton } from "./ui/skeleton";

const VehicleCardSkeleton = () => {
  return (
    <div className="flex flex-col items-center gap-4 h-70 ">
      <Skeleton className="h-52 w-80" />
      <div className="flex flex-row">
        <div className="space-y-2">
          <Skeleton className="h-4 w-80" />
          <Skeleton className="h-4 w-80" />
        </div>
      </div>
    </div>
  );
};

export default VehicleCardSkeleton;
