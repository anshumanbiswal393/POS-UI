import { useState, useMemo, useEffect, useCallback } from "react";
import {
  LifeBuoy,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  PhoneCall,
  ExternalLink,
  Filter,
  RefreshCw,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { PosDataGrid, type PosDataGridColumn } from "@/components/ui/data-grid/PosDataGrid";
import { useOutletContext } from "@/context/PosOutletContext";
import posManagementService, { type POSSupportTicketDto } from "@/services/posManagementService";

interface SupportTicket {
  id: string;
  ticketNumber: string;
  timestamp: string;
  customerName: string;
  contact: string;
  category: string;
  priority: string;
  status: "Open" | "In Progress" | "Resolved";
  assignedTo: string;
  summary: string;
}

export function SupportManagementView() {
  const { activeOutlet } = useOutletContext();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("BILLING_HARDWARE");
  const [priority, setPriority] = useState("HIGH");
  const [contactPhone, setContactPhone] = useState("+91 ");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!activeOutlet?.id) return;
    setIsLoading(true);
    try {
      const data = await posManagementService.getSupportTickets(activeOutlet.id);
      const mapped: SupportTicket[] = data.map((t: POSSupportTicketDto) => {
        let st: "Open" | "In Progress" | "Resolved" = "Open";
        if (t.status === "RESOLVED" || t.status === "CLOSED") st = "Resolved";
        else if (t.status === "IN_PROGRESS") st = "In Progress";

        return {
          id: t.id,
          ticketNumber: t.ticket_number || `RET-SUP-${t.id.slice(0, 4).toUpperCase()}`,
          timestamp: t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "",
          customerName: t.contact_phone ? `Staff (${t.contact_phone})` : "Store User",
          contact: t.contact_phone || "Internal POS Terminal",
          category: t.category?.replace(/_/g, " ") || "General Support",
          priority: t.priority ? t.priority.charAt(0) + t.priority.slice(1).toLowerCase() : "Medium",
          status: st,
          assignedTo: t.response_notes ? "Support Agent" : "IT Support Desk",
          summary: t.description || t.subject || "No description provided",
        };
      });
      setTickets(mapped);
    } catch (err) {
      console.error("Failed to load support tickets:", err);
      toast.error("Failed to load support tickets from server");
    } finally {
      setIsLoading(false);
    }
  }, [activeOutlet?.id]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Please enter a ticket subject");
      return;
    }
    if (!activeOutlet?.id) {
      toast.error("No active outlet selected");
      return;
    }

    setIsSubmitting(true);
    try {
      await posManagementService.createSupportTicket(activeOutlet.id, {
        subject: subject.trim(),
        category,
        priority,
        contact_phone: contactPhone.trim(),
        description: description.trim() || subject.trim(),
        status: "OPEN",
      });
      toast.success("Support ticket opened and saved to server!");
      setIsModalOpen(false);
      setSubject("");
      setDescription("");
      await fetchTickets();
    } catch (err) {
      console.error("Failed to create support ticket:", err);
      toast.error("Failed to create support ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveTicket = async (id: string, ticketNumber: string) => {
    try {
      await posManagementService.resolveSupportTicket(id, "Resolved by store administrator.");
      toast.success(`Ticket ${ticketNumber} marked resolved!`);
      await fetchTickets();
    } catch (err) {
      console.error("Failed to resolve ticket:", err);
      toast.error("Failed to resolve ticket");
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilter !== "All" && ticket.status !== statusFilter) return false;
      if (priorityFilter !== "All" && ticket.priority !== priorityFilter) return false;
      return true;
    });
  }, [tickets, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "Open").length;
    const inProgress = tickets.filter((t) => t.status === "In Progress").length;
    const resolved = tickets.filter((t) => t.status === "Resolved").length;
    return { open, inProgress, resolved, total: tickets.length };
  }, [tickets]);

  const columns: PosDataGridColumn<SupportTicket>[] = [
    {
      id: "ticketNumber",
      header: "Ticket ID",
      accessorKey: "ticketNumber",
      sortable: true,
      defaultWidth: 140,
      render: (_, r) => (
        <span className="font-mono text-[12px] font-bold text-teal-700">{r.ticketNumber}</span>
      ),
    },
    {
      id: "timestamp",
      header: "Created At",
      accessorKey: "timestamp",
      sortable: true,
      defaultWidth: 165,
      render: (_, r) => (
        <span className="font-mono text-[12px] text-slate-600 font-medium">{r.timestamp}</span>
      ),
    },
    {
      id: "category",
      header: "Issue Category",
      accessorKey: "category",
      sortable: true,
      defaultWidth: 175,
      render: (_, r) => (
        <span className="text-[12px] font-semibold text-slate-800">{r.category}</span>
      ),
    },
    {
      id: "priority",
      header: "Priority",
      accessorKey: "priority",
      sortable: true,
      defaultWidth: 110,
      render: (_, r) => {
        let style = "bg-slate-100 text-slate-700";
        if (r.priority === "Urgent" || r.priority === "Critical") style = "bg-rose-100 text-rose-800 font-black";
        else if (r.priority === "High") style = "bg-amber-100 text-amber-800 font-bold";
        else if (r.priority === "Medium") style = "bg-sky-100 text-sky-800";
        return (
          <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${style}`}>
            {r.priority}
          </span>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      defaultWidth: 125,
      render: (_, r) => {
        if (r.status === "Open") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
              <AlertCircle className="h-3 w-3" />
              Open
            </span>
          );
        }
        if (r.status === "In Progress") {
          return (
            <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Clock className="h-3 w-3" />
              In Progress
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            Resolved
          </span>
        );
      },
    },
    {
      id: "summary",
      header: "Ticket Summary",
      accessorKey: "summary",
      defaultWidth: 260,
      render: (_, r) => (
        <div className="text-[12px] text-slate-700 truncate font-medium" title={r.summary}>
          {r.summary}
        </div>
      ),
    },
    {
      id: "contact",
      header: "Contact / Caller",
      accessorKey: "contact",
      defaultWidth: 160,
      render: (_, r) => (
        <div className="text-[11.5px] text-slate-600 font-mono">{r.contact}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      defaultWidth: 120,
      render: (_, r) => {
        if (r.status === "Resolved") {
          return <span className="text-[11px] text-slate-400 font-medium">Completed</span>;
        }
        return (
          <button
            type="button"
            onClick={() => handleResolveTicket(r.id, r.ticketNumber)}
            className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
          >
            <Check className="h-3 w-3" />
            Resolve
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-teal-600" />
            Support Ticket & Incident Management
          </h2>
          <p className="text-[12.5px] text-slate-500">
            Real-time server tickets and hardware escalations for {activeOutlet?.name || "Active Outlet"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTickets}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-teal-700 transition cursor-pointer shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Open Support Ticket
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Open Tickets</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-rose-600">{stats.open}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Require investigation</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>In Progress</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-amber-600">{stats.inProgress}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Assigned to tech desk</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-[22px] font-black text-emerald-600">{stats.resolved}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Successfully closed</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[12px] font-semibold">
            <span>Total Tickets</span>
            <LifeBuoy className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-[22px] font-black text-slate-900">{stats.total}</div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Backend ticket records</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-slate-700">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          Filters:
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="All">All Priorities</option>
          <option value="Urgent">Urgent / Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Main Grid */}
      <PosDataGrid
        data={filteredTickets}
        columns={columns}
        keyField="id"
        pageSize={10}
        showToolbar
        searchPlaceholder="Search tickets, order numbers, or descriptions..."
        emptyMessage="No support tickets opened yet for this outlet."
      />

      {/* Modal to create support ticket */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-teal-600" />
                Raise Support / Hardware Incident Ticket
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Subject / Summary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Thermal printer paper jam on station 2"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="BILLING_HARDWARE">Billing Terminal / Printer Hardware</option>
                    <option value="KDS_SYNC">Kitchen Display Sync / WebSocket</option>
                    <option value="MENU_UPDATE">Menu Catalog & Pricing Help</option>
                    <option value="AGGREGATOR_ISSUE">Swiggy / Zomato Integration</option>
                    <option value="PAYMENT_GATEWAY">EDC Machine / UPI Gateway</option>
                    <option value="OTHER">General Support & Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="CRITICAL">Critical / Store Halted</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Contact Phone / Escalation Extension
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe error messages, station number, or steps to reproduce..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13px] focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-[12.5px] font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-[12.5px] font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Open Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupportManagementView;
