import httpClient from "@/utils/httpClient";

// ==========================================
// Types & Interfaces
// ==========================================

export interface POSOutletConfigPayload {
  details?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  timings?: Record<string, unknown>;
  payment?: Record<string, unknown>;
  invoice_sequences?: Array<Record<string, unknown>>;
  billing_display?: Record<string, unknown>;
  print_logo?: Record<string, unknown>;
  calculations?: Record<string, unknown>;
  connected_services?: Record<string, unknown>;
  print_settings?: Record<string, unknown>;
  customer_settings?: Record<string, unknown>;
  service_mode?: Record<string, unknown>;
  integrations?: Record<string, unknown>;
  billing_preferences?: Record<string, unknown>;
  step_status?: Record<string, unknown>;
}

export interface POSSubOrderTypeDto {
  id: string;
  outlet: string;
  name: string;
  type: string;
  order_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface POSAreaDeliveryChargeDto {
  id: string;
  outlet: string;
  area_name: string;
  min_order_amount: string;
  delivery_charge: string;
  free_delivery_above: string;
  estimated_delivery_time_mins: number;
  is_active: boolean;
}

export interface POSDeliveryDistanceSlabDto {
  id: string;
  outlet: string;
  min_distance_km: string;
  max_distance_km: string;
  delivery_fee: string;
  min_order_amount: string;
  is_active: boolean;
}

export interface POSEmailTemplateDto {
  id: string;
  outlet: string;
  template_type: string;
  name: string;
  subject: string;
  body_html: string;
  sender_name: string;
  sender_email: string;
  is_enabled: boolean;
}

export interface POSBankAccountDto {
  id: string;
  outlet: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  branch_name: string;
  ifsc_code: string;
  upi_vpa: string;
  is_primary: boolean;
  status: string;
}

export interface POSCashDenominationDto {
  id: string;
  outlet: string;
  register?: string;
  shift?: string;
  date: string;
  session_type: string;
  count_2000: number;
  count_500: number;
  count_200: number;
  count_100: number;
  count_50: number;
  count_20: number;
  count_10: number;
  count_5: number;
  count_2: number;
  count_1: number;
  coins: string;
  total_amount: string;
  counted_by_name: string;
  notes?: string;
}

export interface POSExpenseDto {
  id: string;
  outlet: string;
  expense_number: string;
  category: string;
  payee_name: string;
  amount: string;
  tax_amount: string;
  payment_mode: string;
  bill_invoice_number?: string;
  receipt_attachment_url?: string;
  expense_date: string;
  status: string;
  approved_by_name?: string;
  notes?: string;
}

export interface POSGstSettingDto {
  id: string;
  outlet: string;
  gstin: string;
  legal_name: string;
  trade_name: string;
  pan_number?: string;
  state: string;
  state_code: string;
  is_composition: boolean;
  filing_frequency: string;
  default_hsn_code: string;
  turnover_slab?: string;
}

export interface POSVirtualWalletDto {
  id: string;
  outlet: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  balance: string;
  credit_limit: string;
  is_active: boolean;
  transactions?: Array<{
    id: string;
    transaction_type: string;
    amount: string;
    balance_before: string;
    balance_after: string;
    reference?: string;
    note?: string;
    performed_by?: string;
    created_at: string;
  }>;
}

export interface POSBillerGroupDto {
  id: string;
  outlet: string;
  name: string;
  description?: string;
  can_give_discount: boolean;
  max_discount_percentage: string;
  can_void_kot: boolean;
  can_reprint_bill: boolean;
  can_modify_menu: boolean;
  can_settle_due: boolean;
  can_view_reports: boolean;
  can_open_drawer: boolean;
  can_change_table_status: boolean;
  staff_count: number;
}

export interface POSStaffUserDto {
  id: string;
  outlet: string;
  name: string;
  username: string;
  user_code: string;
  phone?: string;
  email?: string;
  biller_group?: string;
  biller_group_name?: string;
  is_active: boolean;
  last_login_at?: string;
}

export interface POSCashierShiftDto {
  id: string;
  outlet: string;
  register: string;
  shift_number: string;
  cashier_name: string;
  status: "OPEN" | "CLOSED";
  opening_float: string;
  closing_cash?: string;
  expected_cash?: string;
  discrepancy_amount?: string;
  start_time: string;
  end_time?: string;
  notes?: string;
  movements?: Array<{
    id: string;
    movement_type: string;
    amount: string;
    reason?: string;
    created_at: string;
  }>;
}

export interface POSManagementLogDto {
  id: string;
  outlet: string;
  log_type: string;
  message: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface POSSupportTicketDto {
  id: string;
  outlet: string;
  ticket_number: string;
  category: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  response_notes?: string;
  created_at: string;
}

export interface POSMarketplaceIntegrationDto {
  id: string;
  outlet: string;
  platform: string;
  name: string;
  store_id: string;
  is_connected: boolean;
  auto_accept_orders: boolean;
  status: string;
  sync_frequency_minutes: number;
  last_sync_at?: string;
}

export interface POSAuditTrailDto {
  id: string;
  outlet: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description: string;
  created_at: string;
}

// ==========================================
// Service Implementation
// ==========================================

export const posManagementService = {
  // ── 1. Outlet Configuration ──────────────────────────────
  async getOutletConfig(outletId: string): Promise<Record<string, unknown>> {
    const res = await httpClient.get(`/api/pos/management/outlet-config/?outlet_id=${outletId}`);
    return res.data;
  },

  async updateOutletConfig(outletId: string, payload: POSOutletConfigPayload): Promise<Record<string, unknown>> {
    const res = await httpClient.put(`/api/pos/management/outlet-config/?outlet_id=${outletId}`, payload);
    return res.data;
  },

  async resetOutletConfigDefaults(outletId: string): Promise<{ success: boolean; config: Record<string, unknown> }> {
    const res = await httpClient.post(`/api/pos/management/outlet-config/reset-defaults/?outlet_id=${outletId}`);
    return res.data;
  },

  // ── 2. Sub-Order Types ────────────────────────────────────
  async getSubOrderTypes(outletId: string): Promise<POSSubOrderTypeDto[]> {
    const res = await httpClient.get(`/api/pos/management/sub-order-types/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createSubOrderType(outletId: string, payload: Partial<POSSubOrderTypeDto>): Promise<POSSubOrderTypeDto> {
    const res = await httpClient.post(`/api/pos/management/sub-order-types/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async updateSubOrderType(id: string, payload: Partial<POSSubOrderTypeDto>): Promise<POSSubOrderTypeDto> {
    const res = await httpClient.patch(`/api/pos/management/sub-order-types/${id}/`, payload);
    return res.data;
  },

  async deleteSubOrderType(id: string): Promise<void> {
    await httpClient.delete(`/api/pos/management/sub-order-types/${id}/`);
  },

  // ── 3. Area Delivery Charges ──────────────────────────────
  async getAreaDeliveryCharges(outletId: string): Promise<POSAreaDeliveryChargeDto[]> {
    const res = await httpClient.get(`/api/pos/management/area-delivery-charges/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createAreaDeliveryCharge(outletId: string, payload: Partial<POSAreaDeliveryChargeDto>): Promise<POSAreaDeliveryChargeDto> {
    const res = await httpClient.post(`/api/pos/management/area-delivery-charges/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async updateAreaDeliveryCharge(id: string, payload: Partial<POSAreaDeliveryChargeDto>): Promise<POSAreaDeliveryChargeDto> {
    const res = await httpClient.patch(`/api/pos/management/area-delivery-charges/${id}/`, payload);
    return res.data;
  },

  async deleteAreaDeliveryCharge(id: string): Promise<void> {
    await httpClient.delete(`/api/pos/management/area-delivery-charges/${id}/`);
  },

  // ── 4. Delivery Distance Slabs ────────────────────────────
  async getDeliveryDistanceSlabs(outletId: string): Promise<POSDeliveryDistanceSlabDto[]> {
    const res = await httpClient.get(`/api/pos/management/delivery-distance-slabs/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createDeliveryDistanceSlab(outletId: string, payload: Partial<POSDeliveryDistanceSlabDto>): Promise<POSDeliveryDistanceSlabDto> {
    const res = await httpClient.post(`/api/pos/management/delivery-distance-slabs/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async updateDeliveryDistanceSlab(id: string, payload: Partial<POSDeliveryDistanceSlabDto>): Promise<POSDeliveryDistanceSlabDto> {
    const res = await httpClient.patch(`/api/pos/management/delivery-distance-slabs/${id}/`, payload);
    return res.data;
  },

  async deleteDeliveryDistanceSlab(id: string): Promise<void> {
    await httpClient.delete(`/api/pos/management/delivery-distance-slabs/${id}/`);
  },

  // ── 5. Email Templates ────────────────────────────────────
  async getEmailTemplates(outletId: string): Promise<POSEmailTemplateDto[]> {
    const res = await httpClient.get(`/api/pos/management/email-templates/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async updateEmailTemplate(id: string, payload: Partial<POSEmailTemplateDto>): Promise<POSEmailTemplateDto> {
    const res = await httpClient.patch(`/api/pos/management/email-templates/${id}/`, payload);
    return res.data;
  },

  async testSendEmailTemplate(id: string, recipientEmail: string): Promise<{ success: boolean; detail: string }> {
    const res = await httpClient.post(`/api/pos/management/email-templates/${id}/send-test/`, {
      recipient_email: recipientEmail,
    });
    return res.data;
  },

  // ── 6. Accounting: Bank Accounts ──────────────────────────
  async getBankAccounts(outletId: string): Promise<POSBankAccountDto[]> {
    const res = await httpClient.get(`/api/pos/management/accounting/bank-details/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createBankAccount(outletId: string, payload: Partial<POSBankAccountDto>): Promise<POSBankAccountDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/bank-details/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async setPrimaryBankAccount(id: string): Promise<POSBankAccountDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/bank-details/${id}/set-primary/`);
    return res.data;
  },

  // ── 7. Accounting: Cash Denominations ─────────────────────
  async getDenominations(outletId: string): Promise<POSCashDenominationDto[]> {
    const res = await httpClient.get(`/api/pos/management/accounting/denominations/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createDenomination(outletId: string, payload: Partial<POSCashDenominationDto>): Promise<POSCashDenominationDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/denominations/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async getLatestDenomination(outletId: string): Promise<POSCashDenominationDto | null> {
    const res = await httpClient.get(`/api/pos/management/accounting/denominations/latest/?outlet_id=${outletId}`);
    return res.data;
  },

  // ── 8. Accounting: Expenses ───────────────────────────────
  async getExpenses(outletId: string, category?: string): Promise<POSExpenseDto[]> {
    const url = category
      ? `/api/pos/management/accounting/expenses/?outlet_id=${outletId}&category=${category}`
      : `/api/pos/management/accounting/expenses/?outlet_id=${outletId}`;
    const res = await httpClient.get(url);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createExpense(outletId: string, payload: Partial<POSExpenseDto>): Promise<POSExpenseDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/expenses/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async approveExpense(id: string, approvedByName: string): Promise<POSExpenseDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/expenses/${id}/approve/`, {
      approved_by_name: approvedByName,
    });
    return res.data;
  },

  async payExpense(id: string, paymentMode: string = "CASH"): Promise<POSExpenseDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/expenses/${id}/pay/`, {
      payment_mode: paymentMode,
    });
    return res.data;
  },

  // ── 9. Accounting: GST Settings ───────────────────────────
  async getGstSettings(outletId: string): Promise<POSGstSettingDto> {
    const res = await httpClient.get(`/api/pos/management/accounting/gst-settings/?outlet_id=${outletId}`);
    return res.data;
  },

  async updateGstSettings(outletId: string, payload: Partial<POSGstSettingDto>): Promise<POSGstSettingDto> {
    const res = await httpClient.put(`/api/pos/management/accounting/gst-settings/?outlet_id=${outletId}`, payload);
    return res.data;
  },

  // ── 10. Accounting: Virtual Wallets ───────────────────────
  async getWallets(outletId: string, search?: string): Promise<POSVirtualWalletDto[]> {
    const url = search
      ? `/api/pos/management/accounting/wallets/?outlet_id=${outletId}&search=${encodeURIComponent(search)}`
      : `/api/pos/management/accounting/wallets/?outlet_id=${outletId}`;
    const res = await httpClient.get(url);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createWallet(outletId: string, payload: Partial<POSVirtualWalletDto>): Promise<POSVirtualWalletDto> {
    const res = await httpClient.post(`/api/pos/management/accounting/wallets/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async topUpWallet(id: string, amount: string, note?: string, performedBy?: string): Promise<{ success: boolean; new_balance: string }> {
    const res = await httpClient.post(`/api/pos/management/accounting/wallets/${id}/top-up/`, {
      amount,
      note,
      performed_by: performedBy,
    });
    return res.data;
  },

  async debitWallet(id: string, amount: string, orderId?: string, note?: string, performedBy?: string): Promise<{ success: boolean; new_balance: string }> {
    const res = await httpClient.post(`/api/pos/management/accounting/wallets/${id}/debit/`, {
      amount,
      order_id: orderId,
      note,
      performed_by: performedBy,
    });
    return res.data;
  },

  // ── 11. Users: Biller Groups & Staff ──────────────────────
  async getBillerGroups(outletId: string): Promise<POSBillerGroupDto[]> {
    const res = await httpClient.get(`/api/pos/management/users/biller-groups/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createBillerGroup(outletId: string, payload: Partial<POSBillerGroupDto>): Promise<POSBillerGroupDto> {
    const res = await httpClient.post(`/api/pos/management/users/biller-groups/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async getStaffUsers(outletId: string, billerGroupId?: string): Promise<POSStaffUserDto[]> {
    const url = billerGroupId
      ? `/api/pos/management/users/biller-users/?outlet_id=${outletId}&biller_group_id=${billerGroupId}`
      : `/api/pos/management/users/biller-users/?outlet_id=${outletId}`;
    const res = await httpClient.get(url);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createStaffUser(outletId: string, payload: Partial<POSStaffUserDto> & { pin?: string }): Promise<POSStaffUserDto> {
    const res = await httpClient.post(`/api/pos/management/users/biller-users/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async resetStaffPin(staffId: string, pin: string): Promise<{ success: boolean; message: string }> {
    const res = await httpClient.post(`/api/pos/management/users/biller-users/${staffId}/reset-pin/`, { pin });
    return res.data;
  },

  async verifyPinLogin(outletId: string, userCode: string, pin: string): Promise<{ success: boolean; staff: Record<string, unknown> }> {
    const res = await httpClient.post("/api/pos/management/users/pin-login/", {
      outlet_id: outletId,
      user_code: userCode,
      pin,
    });
    return res.data;
  },

  async verifySupervisorPin(outletId: string, supervisorPin: string, actionName: string = "SUPERVISOR_OVERRIDE"): Promise<{ success: boolean; authorized: boolean }> {
    const res = await httpClient.post("/api/pos/management/users/supervisor-verify/", {
      outlet_id: outletId,
      supervisor_pin: supervisorPin,
      action: actionName,
    });
    return res.data;
  },

  // ── 12. Shifts & Cash Drawer ──────────────────────────────
  async getActiveShift(registerId: string): Promise<{ active: boolean; shift?: POSCashierShiftDto }> {
    const res = await httpClient.get(`/api/pos/management/shifts/active/?register_id=${registerId}`);
    return res.data;
  },

  async openShift(registerId: string, cashierName: string, openingFloat: string, notes?: string): Promise<POSCashierShiftDto> {
    const res = await httpClient.post("/api/pos/management/shifts/open-shift/", {
      register_id: registerId,
      cashier_name: cashierName,
      opening_float: openingFloat,
      notes,
    });
    return res.data;
  },

  async closeShift(
    shiftId: string,
    actualCashCounted: string,
    denominations?: Record<string, number>,
    notes?: string
  ): Promise<POSCashierShiftDto> {
    const res = await httpClient.post(`/api/pos/management/shifts/${shiftId}/close-shift/`, {
      actual_cash_counted: actualCashCounted,
      denominations,
      notes,
    });
    return res.data;
  },

  async recordCashMovement(
    shiftId: string,
    movementType: "TOP_UP" | "WITHDRAWAL" | "PETTY_EXPENSE",
    amount: string,
    reason?: string
  ): Promise<Record<string, unknown>> {
    const res = await httpClient.post(`/api/pos/management/shifts/${shiftId}/cash-movement/`, {
      movement_type: movementType,
      amount,
      reason,
    });
    return res.data;
  },

  // ── 13. Marketplace & Integrations ────────────────────────
  async getMarketplaceIntegrations(outletId: string): Promise<POSMarketplaceIntegrationDto[]> {
    const res = await httpClient.get(`/api/pos/management/marketplace/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async toggleMarketplaceConnection(id: string): Promise<POSMarketplaceIntegrationDto> {
    const res = await httpClient.post(`/api/pos/management/marketplace/${id}/toggle-connection/`);
    return res.data;
  },

  async testMarketplaceConnection(id: string): Promise<{ success: boolean; status: string; detail: string }> {
    const res = await httpClient.post(`/api/pos/management/marketplace/${id}/test-connection/`);
    return res.data;
  },

  // ── 14. Logs, Audit & Support ─────────────────────────────
  async getManagementLogs(outletId: string, logType?: string): Promise<POSManagementLogDto[]> {
    const url = logType
      ? `/api/pos/management/logs/?outlet_id=${outletId}&log_type=${logType}`
      : `/api/pos/management/logs/?outlet_id=${outletId}`;
    const res = await httpClient.get(url);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async getAuditTrail(outletId: string, actionFilter?: string): Promise<POSAuditTrailDto[]> {
    const url = actionFilter
      ? `/api/pos/management/audit-trail/?outlet_id=${outletId}&action_filter=${actionFilter}`
      : `/api/pos/management/audit-trail/?outlet_id=${outletId}`;
    const res = await httpClient.get(url);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async getSupportTickets(outletId: string): Promise<POSSupportTicketDto[]> {
    const res = await httpClient.get(`/api/pos/management/support-tickets/?outlet_id=${outletId}`);
    return Array.isArray(res.data) ? res.data : res.data.results || [];
  },

  async createSupportTicket(outletId: string, payload: Partial<POSSupportTicketDto>): Promise<POSSupportTicketDto> {
    const res = await httpClient.post(`/api/pos/management/support-tickets/?outlet_id=${outletId}`, {
      ...payload,
      outlet: outletId,
    });
    return res.data;
  },

  async resolveSupportTicket(id: string, responseNotes: string): Promise<POSSupportTicketDto> {
    const res = await httpClient.post(`/api/pos/management/support-tickets/${id}/resolve/`, {
      response_notes: responseNotes,
    });
    return res.data;
  },

  // ── 15. Data Management & Reset ───────────────────────────
  async getDataStats(outletId: string): Promise<{ stats: Record<string, number> }> {
    const res = await httpClient.get(`/api/pos/management/data/stats/?outlet_id=${outletId}`);
    return res.data;
  },

  async resetDemoData(outletId: string, confirmedBy: string = "Admin"): Promise<{ success: boolean; cleared: Record<string, number> }> {
    const res = await httpClient.post(`/api/pos/management/data/reset-demo/?outlet_id=${outletId}`, {
      confirmed_by: confirmedBy,
    });
    return res.data;
  },
};

export default posManagementService;
