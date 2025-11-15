export const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            
            if (!result.success) {
                const zodErrors = result.error.errors || result.error.issues || [];
                
                return res.status(400).json({
                    success: false,
                    message: "Validation error",
                    errors: zodErrors.map(err => ({
                        field: Array.isArray(err.path) ? err.path.join('.') : 'unknown',
                        message: err.message || 'Validation failed'
                    }))
                });
            }
            
            req.body = result.data;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
};

export const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.query);
            
            if (!result.success) {
                const zodErrors = result.error.errors || result.error.issues || [];
                
                return res.status(400).json({
                    success: false,
                    message: "Invalid query parameters",
                    errors: zodErrors.map(err => ({
                        field: Array.isArray(err.path) ? err.path.join('.') : 'unknown',
                        message: err.message || 'Validation failed'
                    }))
                });
            }
            
            req.query = result.data;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
};

export const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.params);
            
            if (!result.success) {
                const zodErrors = result.error.errors || result.error.issues || [];
                
                return res.status(400).json({
                    success: false,
                    message: "Invalid parameters",
                    errors: zodErrors.map(err => ({
                        field: Array.isArray(err.path) ? err.path.join('.') : 'unknown',
                        message: err.message || 'Validation failed'
                    }))
                });
            }
            
            req.params = result.data;
            next();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }
    };
};