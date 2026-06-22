import crypto from "crypto";

// Unambiguous alphabet: no 0/O/1/I/L to keep codes easy to read and type.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

// Generates a single random, human-friendly company code (e.g. "WQ7K2P9X").
// Uses crypto.randomInt for an unbiased character selection.
export const generateCompanyCode = (length = CODE_LENGTH) => {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
};

// Generates a code guaranteed unique against the given model, retrying on
// the rare collision. `Model` must expose `exists({ code })`.
export const generateUniqueCompanyCode = async (Model, maxAttempts = 5) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateCompanyCode();
    const clash = await Model.exists({ code });
    if (!clash) return code;
  }
  throw new Error("Could not generate a unique company code");
};
