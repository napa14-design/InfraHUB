export const generateId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

export const generatePassword = (length = 12) => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*';
  const randomBytes = new Uint32Array(length);
  crypto.getRandomValues(randomBytes);

  let value = '';
  for (let i = 0; i < randomBytes.length; i++) {
    value += alphabet[randomBytes[i] % alphabet.length];
  }

  return value;
};
