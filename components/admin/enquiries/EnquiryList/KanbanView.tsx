"use client";

import { useMemo } from "react";
import { EnquiryListItem } from "../types";
import KanbanColumn from "./KanbanColumn";

interface KanbanViewProps {
  enquiries: EnquiryListItem[];
  onMoveEnquiry: (enquiryId: string, status: string) => void;
  onDragStart: (enquiry: EnquiryListItem) => void;
}

const columns = [
  { title: "New", status: "NEW" },
  { title: "Contacted", status: "CONTACTED" },
  { title: "Demo Scheduled", status: "DEMO_SCHEDULED" },
  { title: "Demo Done", status: "DEMO_DONE" },
  { title: "Interested", status: "INTERESTED" },
  { title: "Converted", status: "CONVERTED" },
] as const;

export default function KanbanView({ enquiries, onMoveEnquiry, onDragStart }: KanbanViewProps) {
  const grouped = useMemo(() => {
    return Object.fromEntries(columns.map((column) => [column.status, enquiries.filter((enquiry) => enquiry.status === column.status)]));
  }, [enquiries]);

  return (
    <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          status={column.status}
          enquiries={grouped[column.status] ?? []}
          count={(grouped[column.status] ?? []).length}
          onDropEnquiry={onMoveEnquiry}
          onDragStart={onDragStart}
        />
      ))}
    </div>
  );
}
