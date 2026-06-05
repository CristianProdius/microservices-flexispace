import { describe, expect, it, vi } from "vitest";
import { deleteUsers } from "./delete-users";

const okResponse = () =>
  ({ ok: true, status: 204, statusText: "No Content" }) as Response;

const errorResponse = (status: number, statusText = "") =>
  ({ ok: false, status, statusText }) as Response;

describe("deleteUsers", () => {
  it("returns the success count when every request succeeds", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(okResponse())
      .mockResolvedValueOnce(okResponse());

    const result = await deleteUsers({
      baseUrl: "https://api.test",
      token: "t",
      ids: ["a", "b"],
      fetchImpl,
    });

    expect(result).toEqual({ successCount: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/users/a",
      expect.objectContaining({
        method: "DELETE",
        headers: { Authorization: "Bearer t" },
      })
    );
  });

  it("throws a partial-failure error when some requests fail", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(okResponse())
      .mockResolvedValueOnce(errorResponse(500, "Internal Server Error"));

    await expect(
      deleteUsers({
        baseUrl: "https://api.test",
        token: "t",
        ids: ["a", "b"],
        fetchImpl,
      })
    ).rejects.toThrowError(/Deleted 1 user\(s\); 1 failed.*HTTP 500/);
  });

  it("throws a total-failure error when every request fails", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(errorResponse(401, "Unauthorized"))
      .mockResolvedValueOnce(errorResponse(403, "Forbidden"));

    await expect(
      deleteUsers({
        baseUrl: "https://api.test",
        token: "t",
        ids: ["a", "b"],
        fetchImpl,
      })
    ).rejects.toThrowError(/Failed to delete 2 user\(s\): HTTP 401/);
  });

  it("captures network rejections as failures rather than success", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(okResponse())
      .mockRejectedValueOnce(new Error("network down"));

    await expect(
      deleteUsers({
        baseUrl: "https://api.test",
        token: "t",
        ids: ["a", "b"],
        fetchImpl,
      })
    ).rejects.toThrowError(/Deleted 1 user\(s\); 1 failed.*network down/);
  });

  it("omits the Authorization header when no token is provided", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValueOnce(okResponse());

    await deleteUsers({
      baseUrl: "https://api.test",
      token: null,
      ids: ["a"],
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.test/users/a",
      expect.objectContaining({ method: "DELETE", headers: undefined })
    );
  });
});
