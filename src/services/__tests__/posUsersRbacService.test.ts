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

    const sampritaAdmin = users.find(
      (u) => u.username === "sampritapatra" || u.email.includes("samprita")
    );
    expect(sampritaAdmin).toBeDefined();
    expect(sampritaAdmin?.role).toBe("pos_admin");

    const arnavUser = users.find((u) => u.username === "arnav" || u.email === "arnav@retrod.in");
    expect(arnavUser).toBeDefined();
    expect(arnavUser?.role).toBe("pos_staff");
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
    const staffRole = roles.find((r) => r.code === "pos_staff" || r.code === "pos_kitchen");
    expect(staffRole).toBeDefined();

    const permissions = await posUsersRbacService.getPermissions();
    expect(permissions.length).toBeGreaterThan(0);
    const billingPerm = permissions.find((p) => p.code === "pos.billing.settle");
    expect(billingPerm).toBeDefined();

    // Grant permission
    const granted = await posUsersRbacService.syncRolePermissions(
      staffRole!.id,
      [billingPerm!.id],
      "assign",
    );
    expect(granted.some((g) => g.permission === billingPerm!.id)).toBe(true);

    // Revoke permission
    const revoked = await posUsersRbacService.syncRolePermissions(
      staffRole!.id,
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

  it("verifies waiter role has billing view/create, floor order take/kot, and KDS ready alerts", async () => {
    const roles = await posUsersRbacService.getRoles();
    const waiterRole = roles.find((r) => r.code === "pos_waiter" || r.name.toLowerCase().includes("waiter"));
    expect(waiterRole).toBeDefined();

    const waiterPerms = await posUsersRbacService.getRolePermissions(waiterRole!.id);
    const permCodes = waiterPerms.map((p) => p.permission_code || p.permission);

    // Waiter permissions
    expect(permCodes).toContain("pos.billing.view");
    expect(permCodes).toContain("pos.billing.create");
    expect(permCodes).toContain("pos.orders.view");
    expect(permCodes).toContain("pos.orders.take");
    expect(permCodes).toContain("pos.orders.kot");
    expect(permCodes).toContain("pos.kot.view");

    // Restricted from settlements, inventory and admin settings
    expect(permCodes).not.toContain("pos.billing.settle");
    expect(permCodes).not.toContain("pos.inventory.view");
    expect(permCodes).not.toContain("pos.inventory.manage");
    expect(permCodes).not.toContain("pos.settings.manage");
    expect(permCodes).not.toContain("pos.users.manage");
  });

  it("verifies default seed users includes Waiter Raju waiter with samprita2022@gift.edu.in", async () => {
    const users = await posUsersRbacService.getUsers();
    const waiter = users.find((u) => u.email === "samprita2022@gift.edu.in" || u.role === "pos_waiter");
    expect(waiter).toBeDefined();
    expect(waiter?.name).toBe("Raju waiter");
    expect(waiter?.email).toBe("samprita2022@gift.edu.in");
    expect(waiter?.role).toBe("pos_waiter");
    expect(waiter?.role_name).toBe("Waiter");
  });

  it("unit tests all user roles routing and respective screen access", async () => {
    const users = await posUsersRbacService.getUsers();

    // 1. Admin Samprita Patra -> /pos master
    const admin = users.find((u) => u.email === "sampritapatra123@gmail.com");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("pos_admin");

    // 2. Kitchen Chef Station -> /pos/kot
    const kitchen = users.find((u) => u.email === "samkhusi123@gmail.com");
    expect(kitchen).toBeDefined();
    expect(kitchen?.role).toBe("pos_kitchen");

    // 3. Waiter Raju waiter -> /pos/billing
    const waiter = users.find((u) => u.email === "samprita2022@gift.edu.in");
    expect(waiter).toBeDefined();
    expect(waiter?.role).toBe("pos_waiter");
    expect(waiter?.name).toBe("Raju waiter");

    // 4. Staff Arnav -> /pos/billing
    const arnav = users.find((u) => u.email === "arnav@retrod.in");
    expect(arnav).toBeDefined();
    expect(arnav?.role).toBe("pos_staff");

    // 5. Dynamically created user -> custom role
    const customUser = await posUsersRbacService.createUser({
      name: "Priya Sharma",
      username: "priya.waiter",
      email: "priya.waiter@restaurant.com",
      phone: "9876543230",
      role: "pos_waiter",
      outlet_name: "Anshu Suite Restaurant",
      is_active: true,
    });
    expect(customUser.id).toBeDefined();
    expect(customUser.email).toBe("priya.waiter@restaurant.com");
    expect(customUser.role).toBe("pos_waiter");

    const refreshedUsers = await posUsersRbacService.getUsers();
    const foundPriya = refreshedUsers.find((u) => u.email === "priya.waiter@restaurant.com");
    expect(foundPriya).toBeDefined();
    expect(foundPriya?.role).toBe("pos_waiter");
  });
});
