"use client";

import { useState, useEffect, useCallback } from "react";
import { StudentDTO } from "../../studentform/types/types";
import { fetchAllStudents } from "../api/studentsApi";

export function useStudents(enabled = true, grade?: string, name?: string) {
  const [data, setData] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (currentGrade?: string, currentName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const students = await fetchAllStudents(currentGrade, currentName);
      setData(students);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger load whenever dependencies change
  useEffect(() => {
    if (enabled) {
      load(grade, name);
    }
  }, [enabled, grade, name, load]);

  const refetch = useCallback(() => {
    return load(grade, name);
  }, [load, grade, name]);

  return { data, loading, error, refetch } as const;
}
