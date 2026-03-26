"use client";

import React from "react";
import { StudentForm } from "../../components/studentform";

export default function JoinUsPage() {
  return (
    <main className="min-h-screen py-12 bg-slate-50">
      <div className="px-4">
        <StudentForm />
      </div>
    </main>
  );
}
