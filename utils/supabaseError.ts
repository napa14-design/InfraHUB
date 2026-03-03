export const extractSupabaseFunctionError = async (error: unknown): Promise<string> => {
  const context = (error as any)?.context;

  if (context && typeof context === 'object' && typeof (context as any).clone === 'function') {
    const response = context as Response;
    const parsedJson = await response.clone().json().catch(() => null);
    if (parsedJson && typeof parsedJson === 'object') {
      if (typeof (parsedJson as any).error === 'string') return (parsedJson as any).error;
      if (typeof (parsedJson as any).message === 'string') return (parsedJson as any).message;
    }

    const textBody = await response.clone().text().catch(() => '');
    if (textBody) return textBody;
  }

  const msgFromBody = (error as any)?.context?.body?.error || (error as any)?.context?.body?.message;
  if (msgFromBody) return msgFromBody;

  return (error as any)?.message || 'Falha ao executar a Edge Function.';
};
