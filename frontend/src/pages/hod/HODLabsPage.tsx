import React, { useEffect, useState } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";

export default function HODLabsPage() {
  const [labs, setLabs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hodService.getLabManagement()
      .then(setLabs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Lab Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{labs.length} department laboratories</p>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total Labs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{labs.length}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Occupied</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{labs.filter(l => l.isOccupied).length}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Available</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{labs.filter(l => !l.isOccupied).length}</p>
          </Card>
          <Card padding="md">
            <p className="text-2xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Capacity</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{labs.reduce((a, l) => a + (l.capacity || 0), 0)}</p>
          </Card>
        </div>

        {/* Lab Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {labs.map((lab) => (
            <Card key={lab._id} padding="md" className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold ${lab.isOccupied ? "bg-amber-500" : "bg-emerald-500"}`}>
                    {lab.labCode?.slice(-2) || "LB"}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{lab.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{lab.labCode} · Department Facility</p>
                  </div>
                </div>
                <Badge variant={lab.isOccupied ? "warning" : "success"} size="sm" dot>
                  {lab.isOccupied ? "Occupied" : "Available"}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] text-xs">
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Capacity</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{lab.capacity || 0}</p>
                </div>
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Courses</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{lab.courseIds?.length || 0}</p>
                </div>
                <div>
                  <p className="text-2xs text-gray-400 dark:text-gray-500 uppercase">Equipment</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-0.5">{lab.equipment?.length || 0}</p>
                </div>
              </div>

              {lab.labInchargeId && (
                <div className="pt-3 border-t border-gray-100 dark:border-white/[0.04] text-xs text-gray-500 dark:text-gray-400">
                  <span>Lab In-charge: </span>
                  <span className="font-medium text-gray-900 dark:text-white">{typeof lab.labInchargeId === "object" ? lab.labInchargeId.name : "Faculty"}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
