import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.get("/gradebook"), api.get("/courses")])
      .then(([gradesRes, coursesRes]) => {
        if (gradesRes.status === "fulfilled") setGrades(gradesRes.value.data.data || []);
        if (coursesRes.status === "fulfilled") setCourses(coursesRes.value.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-auto surface-page">
        <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Group grades by course
  const gradesByCourse = courses.map((c) => {
    const courseGrades = grades.filter((g: any) => {
      const cid = typeof g.courseId === "object" ? g.courseId._id : g.courseId;
      return cid === c._id;
    });
    const totalObtained = courseGrades.reduce((a: number, g: any) => a + g.marksObtained, 0);
    const totalMax = courseGrades.reduce((a: number, g: any) => a + g.maxMarks, 0);
    return { ...c, grades: courseGrades, totalObtained, totalMax, pct: totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0 };
  }).filter(c => c.grades.length > 0);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1000px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Internal Marks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Subject-wise internal assessment marks</p>
        </div>

        {gradesByCourse.length === 0 ? (
          <EmptyState
            title="No grades posted yet"
            description="Your internal marks will appear here once published by faculty."
          />
        ) : (
          gradesByCourse.map((c) => (
            <Card key={c._id} padding="none">
              <div className="px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{c.name}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{c.courseCode} · {c.credits} Credits</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${c.pct >= 70 ? "text-emerald-600 dark:text-emerald-400" : c.pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                    {c.totalObtained} / {c.totalMax}
                  </p>
                  <Badge variant={c.pct >= 70 ? "success" : c.pct >= 50 ? "warning" : "danger"} size="sm">
                    {c.pct}%
                  </Badge>
                </div>
              </div>
              <div className="divider" />
              <div className="p-5">
                <div className="space-y-2">
                  {c.grades.map((g: any) => {
                    const itemPct = g.maxMarks > 0 ? Math.round((g.marksObtained / g.maxMarks) * 100) : 0;
                    return (
                      <div key={g._id} className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50/60 dark:bg-white/[0.02]">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{g.title}</p>
                          <p className="text-2xs text-gray-400 dark:text-gray-500 capitalize mt-0.5">{g.type}{g.weightage ? ` · ${g.weightage}% weightage` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.marksObtained}<span className="text-gray-400 font-normal">/{g.maxMarks}</span></p>
                          <p className={`text-2xs font-semibold mt-0.5 ${itemPct >= 70 ? "text-emerald-600 dark:text-emerald-400" : itemPct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {itemPct}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
