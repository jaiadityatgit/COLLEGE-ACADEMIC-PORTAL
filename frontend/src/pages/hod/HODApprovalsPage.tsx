import React, { useEffect, useState } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";

type TabKey = "all" | "announcement" | "timetable" | "course";

export default function HODApprovalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "approve" | "reject"; type: string; title: string } | null>(null);

  const fetchData = async () => {
    try {
      const result = await hodService.getApprovalQueue();
      setData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async () => {
    if (!confirmModal) return;
    setProcessing(confirmModal.id);
    try {
      await hodService.processApproval(confirmModal.id, confirmModal.action, confirmModal.type);
      setData((prev: any) => ({
        ...prev,
        items: prev.items.filter((item: any) => item._id !== confirmModal.id),
        counts: { ...prev.counts, total: prev.counts.total - 1, [confirmModal.type + "s"]: Math.max(0, (prev.counts[confirmModal.type + "s"] || 1) - 1) }
      }));
    } catch (err) { console.error(err); }
    finally { setProcessing(null); setConfirmModal(null); }
  };

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-48 rounded-lg" />
          <div className="skeleton h-10 w-full rounded-xl" />
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const items = (data?.items || []).filter((item: any) => activeTab === "all" || item.type === activeTab);
  const counts = data?.counts || {};

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "all", label: "All Requests", count: counts.total || 0 },
    { key: "announcement", label: "Announcements", count: counts.announcements || 0 },
    { key: "timetable", label: "Timetable", count: counts.timetable || 0 },
    { key: "course", label: "Courses", count: counts.courses || 0 },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Approval Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review and process pending department requests</p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold"
                  : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-2xs ${activeTab === tab.key ? "bg-white/20 dark:bg-gray-900/20 text-white dark:text-gray-900" : "text-gray-400"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Items */}
        {items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item: any) => (
              <Card key={item._id} padding="md" className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={item.type === "announcement" ? "info" : item.type === "timetable" ? "warning" : "success"} size="sm">
                        {item.type}
                      </Badge>
                      {item.priority === "high" && <Badge variant="danger" size="sm">High Priority</Badge>}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    {item.body && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{item.body}</p>}
                    <p className="text-2xs text-gray-400 dark:text-gray-500 mt-2">
                      Requested by {typeof item.requestedBy === "object" ? item.requestedBy.name : "Faculty"} · {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={processing === item._id}
                      onClick={() => setConfirmModal({ id: item._id, action: "reject", type: item.type, title: item.title })}
                    >
                      Reject
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={processing === item._id}
                      onClick={() => setConfirmModal({ id: item._id, action: "approve", type: item.type, title: item.title })}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="All caught up"
            description="There are no pending requests requiring your approval."
          />
        )}

        {/* Confirmation Modal */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <Card padding="lg" className="w-full max-w-md space-y-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Confirm {confirmModal.action === "approve" ? "Approval" : "Rejection"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Are you sure you want to {confirmModal.action} "{confirmModal.title}"?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmModal(null)}>Cancel</Button>
                <Button
                  variant={confirmModal.action === "approve" ? "primary" : "secondary"}
                  size="sm"
                  onClick={handleAction}
                >
                  Confirm
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
