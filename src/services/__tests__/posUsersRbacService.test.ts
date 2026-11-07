// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posUsersRbacService } from "../posUsersRbacService";
import { ROLE_PERMISSIONS } from "@/lib/auth/rbac";

describe("posUsersRbacService - Seed Accounts & CRUD Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with admin and kitchen station seed users", async () => {
    const users = await posUsersRbacService.getUsers();
    expect(users.length).toBeGreaterThanOrEqual(2);
    const kitchenUser = users.find((u) => u.username === "kitchen");
    expect(kitchenUser).toBeDefined();
    expect(kitchenUser?.role).toBe("pos_kitchen");
    expect(kitchenUser?.email).toBe("samkhusi123@gmail.com");
    expect(kitchenUser?.pin).toBe("1122");

    const sampritaAdmin = users.find((u) => u.username === "sampritapatra" || u.email === "sampritapatra@gmail.com");
    expect(sampritaAdmin).toBeDefined();
    expect(sampritaAdmin?.role).toBe("pos_admin");

    const adminUser = users.find((u) => u.username === "aarav");
    expect(adminUser).toBeDefined();
    expect(adminUser?.role).toBe("pos_admin");
  });

  it("creates a new staff user and saves to user list", async () => {
    const newUser = await posUsersRbacService.createUser({
      name: "Ramesh Sharma",
      username: "ramesh.s",
      email: "ramesh@restaurant.com",
      phone: "+91 9876543210",
      role: "pos_cashier",
      outlet_name: "Main Dining",
      pin: "1234",
      is_active: true,
    });

    expect(newUser.id).toBeDefined();
    expect(newUser.name).toBe("Ramesh Sharma");
    expect(newUser.role).toBe("pos_cashier");
    expect(newUser.pin).toBe("1234");
    expect(newUser.is_active).toBe(true);

    const users = await posUsersRbacService.getUsers();
    expect(users.some((u) => u.id === newUser.id)).toBe(true);
  });

  it("updates an existing staff user and toggles status", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Anita Verma",
      username: "anita.v",
      email: "anita@restaurant.com",
      role: "pos_captain",
      is_active: true,
    });

    const updated = await posUsersRbacService.updateUser(created.id, {
      name: "Anita Verma (Senior)",
      is_active: false,
      pin: "9988",
    });

    expect(updated.name).toBe("Anita Verma (Senior)");
    expect(updated.is_active).toBe(false);
    expect(updated.pin).toBe("9988");

    const users = await posUsersRbacService.getUsers();
    const found = users.find((u) => u.id === created.id);
    expect(found?.is_active).toBe(false);
    expect(found?.pin).toBe("9988");
  });

  it("deletes a staff user", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Junior Chef Vikas",
      username: "vikas.jr",
      email: "vikas.jr@kitchen.com",
      role: "pos_kitchen",
    });

    let users = await posUsersRbacService.getUsers();
    expect(users.some((u) => u.id === created.id)).toBe(true);

    await posUsersRbacService.deleteUser(created.id);

    users = await posUsersRbacService.getUsers();
    expect(users.some((u) => u.id === created.id)).toBe(false);
  });

  it("provides standard POS roles and permits granting & revoking permissions", async () => {
    const roles = await posUsersRbacService.getRoles();
    expect(roles.length).toBeGreaterThan(0);
    const cashierRole = roles.find((r) => r.code === "pos_cashier");
    expect(cashierRole).toBeDefined();

    const permissions = await posUsersRbacService.getPermissions();
    expect(permissions.length).toBeGreaterThan(0);
    const billingPerm = permissions.find((p) => p.code === "pos.billing.settle");
    expect(billingPerm).toBeDefined();

    // Grant permission
    const granted = await posUsersRbacService.syncRolePermissions(
      cashierRole!.id,
      [billingPerm!.id],
      "assign",
    );
    expect(granted.some((g) => g.permission === billingPerm!.id)).toBe(true);

    // Revoke permission
    const revoked = await posUsersRbacService.syncRolePermissions(
      cashierRole!.id,
      [billingPerm!.id],
      "revoke",
    );
    expect(revoked.some((g) => g.permission === billingPerm!.id)).toBe(false);
  });

  it("verifies kitchen role has KOT and full Stock inventory permissions", () => {
    const kitchenPerms = ROLE_PERMISSIONS.pos_kitchen;
    expect(kitchenPerms).toContain("pos.kot.view");
    expect(kitchenPerms).toContain("pos.kot.manage");
    expect(kitchenPerms).toContain("pos.inventory.view");
    expect(kitchenPerms).toContain("pos.inventory.manage");
    expect(kitchenPerms).toContain("pos.inventory.wastage");
    expect(kitchenPerms).toContain("pos.inventory.production");
    expect(kitchenPerms).toContain("pos.inventory.purchase_orders");

    // Kitchen must NOT have access to cashier billing or management settings
    expect(kitchenPerms).not.toContain("pos.billing.view");
    expect(kitchenPerms).not.toContain("pos.billing.settle");
    expect(kitchenPerms).not.toContain("pos.settings.manage");
    expect(kitchenPerms).not.toContain("pos.users.manage");
  });
});
