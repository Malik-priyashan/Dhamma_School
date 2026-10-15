import { StudentDTO } from "../types/types";
import { normalizeDto } from "../dto/dto";
import { fetchWithAuth } from "../../auth/api/authApi";

export async function submitStudentRequest(dto: StudentDTO) {
  const url = '/api/proxy/student-request/submit';

  const payload = normalizeDto(dto as unknown as Record<string, unknown>);

  const res = await fetchWithAuth(url, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getLatestRegistrationPaymentAmount() {
  const url = '/api/proxy/registration-payment';

  const res = await fetchWithAuth(url, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => null);
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }

  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    // If the response is not valid JSON (e.g., just a plain number "1500"), return the text directly
    return text;
  }
}
