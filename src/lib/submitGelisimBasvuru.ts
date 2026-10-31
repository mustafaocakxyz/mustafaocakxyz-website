import { fetchPublicActiveStudentCount } from './fetchPublicStudentCount';
import { GELISIM_CAPACITY, GELISIM_CAPACITY_FULL_MESSAGE } from './gelisimCapacity';

export async function submitGelisimBasvuru(formValues: Record<string, string>) {
  const isim = (formValues.isim ?? '').trim();
  const telefon = (formValues.telefon ?? '').trim();

  if (!isim || !telefon) {
    throw new Error('İsim ve telefon numarası zorunludur.');
  }

  const studentCount = await fetchPublicActiveStudentCount();
  if (studentCount >= GELISIM_CAPACITY) {
    throw new Error(GELISIM_CAPACITY_FULL_MESSAGE);
  }

  const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
  const secret = import.meta.env.VITE_GELISIM_SUBMIT_SECRET;

  if (!scriptUrl || !secret) {
    throw new Error('Form gönderimi yapılandırılmamış.');
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      formType: 'gelisim',
      secret,
      ...formValues,
    }),
  });

  let result: { ok?: boolean; error?: string };
  try {
    result = await response.json();
  } catch {
    throw new Error('Sunucudan geçersiz yanıt alındı.');
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || 'Gönderim başarısız.');
  }
}
