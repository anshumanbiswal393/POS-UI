// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { posUsersRbacService } from "../posUsersRbacService";

describe("posUsersRbacService - Zero Dummy Data & CRUD Operations", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with zero dummy users", async () => {
    const users = await posUsersRbacService.getUsers();
    expect(users).toEqual([]);
    expect(users.length).toBe(0);
  });

  it("creates a new staff user without dummy data", async () => {
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
    expect(users.length).toBe(1);
    expect(users[0].name).toBe("Ramesh Sharma");
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
    expect(users[0].is_active).toBe(false);
    expect(users[0].pin).toBe("9988");
  });

  it("deletes a staff user", async () => {
    const created = await posUsersRbacService.createUser({
      name: "Chef Vikas",
      username: "vikas.chef",
      email: "vikas@kitchen.com",
      role: "pos_chef",
    });

    let users = await posUsersRbacService.getUsers();
    expect(users.length).toBe(1);

    await posUsersRbacService.deleteUser(created.id);

    users = await posUsersRbacService.getUsers();
    expect(users.length).toBe(0);
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
      "assign"
    );
    expect(granted.some((g) => g.permission === billingPerm!.id)).toBe(true);

    // Revoke permission
    const revoked = await posUsersRbacService.syncRolePermissions(
      cashierRole!.id,
      [billingPerm!.id],
      "revoke"
    );
    expect(revoked.some((g) => g.permission === billingPerm!.id)).toBe(false);
  });
});
