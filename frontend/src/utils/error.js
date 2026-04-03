export const getErrorMessage = (error) => {
    if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) {
            // Handle Pydantic validation errors (array of objects)
            return detail.map(err => err.msg || JSON.stringify(err)).join(', ');
        }
        if (typeof detail === 'object') {
            return JSON.stringify(detail);
        }
        return String(detail);
    }
    return error.message || 'An unexpected error occurred';
};
