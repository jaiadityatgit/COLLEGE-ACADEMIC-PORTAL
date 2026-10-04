import React, { useState } from "react";
import { hodService } from "../../services/hodService";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

type ReportType = "attendance" | "results" | "faculty-workload" | "student-performance" | "assignments";

const reportTypes: { key: ReportType; label: string; description: string }[] = [
  { key: "attendance", label: "Department Attendance", description: "Attendance records per student per course" },
  { key: "results", label: "Department Results", description: "Grade records with marks and percentages" },
  { key: "faculty-workload", label: "Faculty Workload", description: "Teaching load, sessions, and assignments per faculty" },
  { key: "student-performance", label: "Student Performance", description: "Combined grades and attendance per student" },
  { key: "assignments", label: "Assignment Statistics", description: "Submission and grading stats per assignment" },
];

function downloadCSV(data: any) {
  if (!data?.rows || !data?.columns) return;
  const header = data.columns.join(",");
  const rows = data.rows.map((row: any) => data.columns.map((col: string) => {
    const val = row[col];
    if (val === null || val === undefined) return "";
    const str = String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n") ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(","));
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${data.title || "report"}.csv`; a.click();
  URL.revokeObjectURL(url);
}

function downloadExcel(data: any) {
  if (!data?.rows || !data?.columns) return;
  const header = data.columns.join("\t");
  const rows = data.rows.map((row: any) => data.columns.map((col: string) => String(row[col] ?? "")).join("\t"));
  const content = [header, ...rows].join("\n");
  const blob = new Blob([content], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${data.title || "report"}.xls`; a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(data: any) {
  const printWindow = window.open("", "_blank");
  if (!printWindow || !data?.rows || !data?.columns) return;
  const tableRows = data.rows.map((row: any) =>
    `<tr>${data.columns.map((col: string) => `<td style="padding:6px 10px;border:1px solid #ddd;font-size:12px;">${row[col] ?? ""}</td>`).join("")}</tr>`
  ).join("");
  const html = `
    <!DOCTYPE html><html><head><title>${data.title || "Report"}</title>
    <style>body{font-family:Inter,sans-serif;padding:20px;}table{border-collapse:collapse;width:100%;}th{background:#f1f3f4;padding:8px 10px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:left;}h1{font-size:18px;margin-bottom:4px;}p{color:#666;font-size:12px;margin-bottom:16px;}</style>
    </head><body>
    <h1>${data.title || "Report"}</h1>
    <p>Generated: ${new Date(data.generatedAt || Date.now()).toLocaleString()} • ${data.rows.length} records</p>
    <table><thead><tr>${data.columns.map((col: string) => `<th>${col.replace(/([A-Z])/g, " $1").trim()}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table>
    </body></html>`;
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); }, 500);
}

const columnLabels: Record<string, string> = {
  studentName: "Student", studentEmail: "Email", courseName: "Course", courseCode: "Code",
  total: "Total", present: "Present", percentage: "Percentage", type: "Type", title: "Title",
  marksObtained: "Marks", maxMarks: "Max Marks", name: "Name", email: "Email",
  coursesCount: "Courses", courses: "Course Names", attendanceSessionsMarked: "Sessions Marked",
  assignmentsCreated: "Assignments", rollNumber: "Roll No.", gradeAverage: "Grade Avg",
  totalAssessments: "Assessments", attendancePercentage: "Attendance", userName: "User",
  userRole: "Role", jobType: "Job Type", count: "Count", completed: "Completed",
  createdBy: "Created By", dueDate: "Due Date", totalMarks: "Total Marks",
  submissions: "Submissions", graded: "Graded", avgMarks: "Avg Marks"
};

export default function HODReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (type: ReportType) => {
    setSelectedType(type);
    setLoading(true);
    setReportData(null);
    try {
      const result = await hodService.getReport(type);
      setReportData(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Report Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate and export department analytics reports</p>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reportTypes.map((rt) => {
            const isSelected = selectedType === rt.key;
            return (
              <Card key={rt.key} padding="md" className="space-y-3 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{rt.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{rt.description}</p>
                </div>
                <Button
                  variant={isSelected ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => handleGenerate(rt.key)}
                  disabled={loading && isSelected}
                >
                  {loading && isSelected ? "Generating..." : "Generate Report"}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* Generated Report Data Table */}
        {reportData && (
          <Card padding="none">
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{reportData.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {reportData.rows?.length || 0} records generated
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => downloadCSV(reportData)}>Export CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => downloadExcel(reportData)}>Export Excel</Button>
                <Button variant="primary" size="sm" onClick={() => downloadPDF(reportData)}>Print PDF</Button>
              </div>
            </div>
            <div className="divider" />
            <div className="overflow-x-auto max-h-[500px]">
              <table className="erp-table">
                <thead>
                  <tr>
                    {reportData.columns?.map((col: string) => (
                      <th key={col}>{columnLabels[col] || col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.rows?.map((row: any, idx: number) => (
                    <tr key={idx}>
                      {reportData.columns?.map((col: string) => (
                        <td key={col} className="text-xs">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
