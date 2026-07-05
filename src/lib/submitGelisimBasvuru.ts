export async function submitGelisimBasvuru(formValues: Record<string, string>) {
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
