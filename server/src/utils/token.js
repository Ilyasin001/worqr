import jwt from "jsonwebtoken";

// Signs a JWT carrying the identity, role, and tenant (companyId) needed
// for authentication + company-scoped authorization.
export const signToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      companyId: user.company,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );
};
