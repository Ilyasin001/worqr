import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("AUTH HEADER:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { userId, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid" }) ;
  }
};

export const adminOnly = (req, res, next) => {
  console.log("REQ USER:", req.user);

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admins only" });
  }
  next();
};
