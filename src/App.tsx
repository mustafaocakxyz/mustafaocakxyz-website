import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalStyle } from './styles/GlobalStyle';
import { GelisimProgramiPage } from './pages/GelisimProgramiPage';
import { HomePage } from './pages/HomePage';
import { TekSeferlikPage } from './pages/TekSeferlikPage';
import { TekSeferlikPaymentPage } from './pages/TekSeferlikPaymentPage';
import { TekSeferlikHavalePage } from './pages/TekSeferlikHavalePage';

export default function App() {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tek-seferlik" element={<TekSeferlikPage />} />
        <Route path="/tek-seferlik/odeme" element={<TekSeferlikPaymentPage />} />
        <Route path="/tek-seferlik/odeme/havale" element={<TekSeferlikHavalePage />} />
        <Route path="/gelisim-programi" element={<GelisimProgramiPage />} />
      </Routes>
    </BrowserRouter>
  );
}
