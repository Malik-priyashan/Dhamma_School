"use client";

import { useState, useEffect, useCallback } from "react";
import { StudentRequest } from "../types/types";
import { fetchAllStudentRequests } from "../api/studentRequestsApi";
import { normalizeStudentRequests } from "../dto/dto";

export function useStudentRequests(enabled = true, pageNum = 1, limitNum = 15, status?: string, createdDate?: string) {
  const [data, setData] = useState<StudentRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await fetchAllStudentRequests(pageNum, limitNum, status, createdDate);
      const normalized = normalizeStudentRequests(raw.data as unknown);
      setData(normalized);
      setTotal(raw.total || 0);
      setPage(raw.page || 1);
      setLimit(raw.limit || 15);
      setTotalPages(raw.totalPages || 1);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [pageNum, limitNum, status, createdDate]);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [load, enabled]);

  return { data, total, page, limit, totalPages, loading, error, refetch: load } as const;
}
