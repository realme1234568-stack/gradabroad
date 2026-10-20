import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabaseServer", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: mocks.getUser },
    rpc: mocks.rpc,
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error("redirect:" + url);
  },
  notFound: () => {
    throw new Error("not-found");
  },
}));
vi.mock("@/components/OwnerDashboard", () => ({ default: () => null }));
import AdminPage from "@/app/admin/page";
import { signInDestination } from "@/lib/signInDestination";
beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.rpc.mockReset();
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "owner" } },
    error: null,
  });
});
test("signed-out owner visits lead to sign-in with a validated owner destination", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await expect(AdminPage()).rejects.toThrow(
    "redirect:/auth/error?reason=signin&next=%2Fadmin",
  );
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(signInDestination("/admin")).toBe("/admin");
});
test("ordinary users and forged truthy role responses cannot render owner tools", async () => {
  mocks.rpc.mockResolvedValue({ data: false, error: null });
  await expect(AdminPage()).rejects.toThrow("not-found");
  mocks.rpc.mockResolvedValue({ data: "true", error: null });
  await expect(AdminPage()).rejects.toThrow("not-found");
});
test("verified owner role renders tools and service failure fails closed", async () => {
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  expect(await AdminPage()).toBeTruthy();
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "offline" } });
  const page = await AdminPage();
  expect(JSON.stringify(page)).toContain("Owner workspace unavailable");
});
