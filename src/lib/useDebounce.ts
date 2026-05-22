import { useState, useEffect } from 'react';

/**
 * Atrasa a atualização de um valor enquanto o usuário ainda está digitando.
 * Evita re-renderizações excessivas em campos de busca.
 * @param value  Valor imediato (ex: estado do input)
 * @param delay  Espera em ms antes de atualizar (padrão: 300ms)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
