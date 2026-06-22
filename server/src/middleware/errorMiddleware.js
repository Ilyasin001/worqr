// Centralized error handler. Controllers should `next(err)` and let this
// translate the error into a consistent JSON response.
export const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode ?? 500;
    let message = err.message || "Internal server error";

    // Mongoose schema validation (incl. thrown pre-save hook errors surface as plain Error)
    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(", ");
    }

    // Invalid ObjectId or other cast failure
    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}: ${err.value}`;
    }

    // Duplicate unique key
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0] ?? "field";
        message = `A record with that ${field} already exists`;
    }

    res.status(statusCode).json({
        success: false,
        message,
    });
};
