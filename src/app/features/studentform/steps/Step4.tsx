"use client";

import React, { useEffect, useState } from "react";
import { StepProps } from "../types/types";
import { useTranslations } from "next-intl";
import { getLatestRegistrationPaymentAmount } from "../api/studentRequestApi";

export default function Step4({ data, onChange }: StepProps) {
  const t = useTranslations();
  const [loadingAmt, setLoadingAmt] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchAmount = async () => {
      try {
        setLoadingAmt(true);
        const res = await getLatestRegistrationPaymentAmount();
        console.log("Fetched payment amount response:", res); // Debug log
        
        if (active && res) {
          // Handle different possible response formats: { amount: 1000 } or { fee: 1000 } or { registrationPayment: 1000 }
          const arr = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : (res && Array.isArray(res.content) ? res.content : null));
          
          let extractedAmount = null;
          
          if (arr && arr.length > 0) {
            // Sort by createdAt descending to get the latest
            const sortedArr = [...arr].sort((a, b) => {
              if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              if (a.id && b.id) {
                 return Number(b.id) - Number(a.id);
              }
              return 0; // fallback if no date
            });
            const latest = sortedArr[0];
            extractedAmount = Number(latest.amount) || Number(latest.registrationPayment) || Number(latest.payment) || Number(latest.fee);
          } else if (res && !Array.isArray(res) && typeof res === 'object') {
            extractedAmount = Number(res.amount) || Number(res.registrationPayment) || Number(res.payment) || Number(res.fee);
          } else if (typeof res === 'number' || (typeof res === 'string' && !isNaN(Number(res)) && res !== '')) {
            extractedAmount = Number(res);
          }

          if (extractedAmount !== null && !isNaN(extractedAmount)) {
            // Force the value unconditionally on mount to beat local storage caches
            onChange('registrationPayment', extractedAmount);
            console.log("Successfully extracted amount:", extractedAmount);
          } else {
            console.warn("Could not extract a valid amount from:", res);
          }
        }
      } catch (err) {
        console.error("Failed to fetch payment amount", err);
      } finally {
        if (active) setLoadingAmt(false);
      }
    };
    fetchAmount();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-black">{t('form.registrationPayment')}</span>
        <input 
          type="number" 
          value={data.registrationPayment ?? ''} 
          readOnly
          className={`mt-1 block w-full rounded-lg border border-black px-3 py-3 shadow-sm text-black ${loadingAmt ? 'bg-slate-100 animate-pulse' : 'bg-slate-100 cursor-not-allowed'}`} 
        />
        {loadingAmt && <p className="text-xs text-slate-500 mt-1">Loading latest fee...</p>}
      </label>

      <label className="flex items-center gap-2">
        <input type="checkbox" checked={!!data.agreeToTerms} onChange={(e) => onChange('agreeToTerms', e.target.checked)} className="w-4 h-4 border-black" />
        <span className="text-sm text-black">{t('form.agreeToTerms')}</span>
      </label>
    </div>
  );
}
