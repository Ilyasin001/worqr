import { jest } from "@jest/globals";
import { generateCompanyCode, generateUniqueCompanyCode } from "../../utils/companyCode.js";

describe("generateCompanyCode", () => {
  it("returns a code of the default length (8)", () => {
    expect(generateCompanyCode()).toHaveLength(8);
  });

  it("respects a custom length", () => {
    expect(generateCompanyCode(12)).toHaveLength(12);
  });

  it("only uses the unambiguous alphabet (no 0/O/1/I/L)", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCompanyCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]+$/);
    }
  });
});

describe("generateUniqueCompanyCode", () => {
  it("returns the first code when there is no collision", async () => {
    const Model = { exists: jest.fn().mockResolvedValue(null) };
    const code = await generateUniqueCompanyCode(Model);
    expect(code).toHaveLength(8);
    expect(Model.exists).toHaveBeenCalledTimes(1);
  });

  it("retries on collision then succeeds", async () => {
    const Model = {
      exists: jest.fn()
        .mockResolvedValueOnce({ _id: "x" }) // first code clashes
        .mockResolvedValueOnce(null),         // second is free
    };
    const code = await generateUniqueCompanyCode(Model);
    expect(code).toHaveLength(8);
    expect(Model.exists).toHaveBeenCalledTimes(2);
  });

  it("throws after exhausting attempts", async () => {
    const Model = { exists: jest.fn().mockResolvedValue({ _id: "x" }) };
    await expect(generateUniqueCompanyCode(Model, 3)).rejects.toThrow(/unique company code/);
    expect(Model.exists).toHaveBeenCalledTimes(3);
  });
});
