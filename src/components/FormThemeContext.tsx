import { createContext, useContext, type ReactNode } from 'react';
import type { ThemeColor } from '../styles/theme';

const FormThemeContext = createContext<ThemeColor>('blue');

type FormThemeProviderProps = {
  theme: ThemeColor;
  children: ReactNode;
};

export function FormThemeProvider({ theme, children }: FormThemeProviderProps) {
  return (
    <FormThemeContext.Provider value={theme}>{children}</FormThemeContext.Provider>
  );
}

export function useFormTheme(): ThemeColor {
  return useContext(FormThemeContext);
}
