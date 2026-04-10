type ApiResponse<T> = {
    data: T;
    message: string;
    status: number;
};

type PagedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
};