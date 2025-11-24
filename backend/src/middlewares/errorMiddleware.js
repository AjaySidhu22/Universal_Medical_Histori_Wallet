// // Centralized error handler middleware
// const errorHandler = (err, req, res, next) => {
//   console.error(err.stack);

//   const statusCode = err.statusCode || 500;
//   const message = err.message || 'Internal Server Error';

//   res.status(statusCode).json({
//     success: false,
//     message,
//     stack: process.env.NODE_ENV === 'production' ? null : err.stack,
//   });
// };

// module.exports = errorHandler;


/**
 * Centralized Error Handler Middleware.
 * This is the final safety net, catching errors via the (err, req, res, next) signature.
 * @module errorHandler
 */
const errorHandler = (err, req, res, next) => {
    // Determine initial status code and log the full error internally
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log the error stack to the server console (includes req.user info if available)
    console.error(`--- ERROR (User: ${req.user?.id || 'Public'}) ---`);
    console.error(`Status: ${statusCode}, Message: ${message}`);
    console.error(err.stack);
    console.error('-------------------------------------------');


    // --- Improvement: Handle Specific Sequelize/Database Errors ---
    
    // 1. Sequelize Validation Error (400 Bad Request)
    if (err.name === 'SequelizeValidationError') {
        // Example: Email format validation fails, password length issue.
        statusCode = 400;
        message = err.errors.map(e => e.message).join(', ') || 'Validation failed.';
    }

    // 2. Sequelize Unique Constraint Error (409 Conflict)
    if (err.name === 'SequelizeUniqueConstraintError') {
        // Example: User tries to register with an existing email.
        statusCode = 409; 
        const field = Object.keys(err.fields)[0];
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
    }
    
    // 3. Sequelize Eager Loading Error (500 Internal Error, but clarify)
    if (err.name === 'SequelizeEagerLoadingError') {
         statusCode = 500;
         // Return a more generic error in production but detailed in dev
         message = process.env.NODE_ENV === 'production' ? 'Server configuration error.' : err.message;
    }


    // Send the structured JSON response
    res.status(statusCode).json({
        success: false,
        message,
        // Include stack trace ONLY in non-production environments for security
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;