import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { GlobalStyle } from './styles/GlobalStyle';
import { GelisimProgramiPage } from './pages/GelisimProgramiPage';
import { GelisimProgramiBasvuruIntroPage } from './pages/GelisimProgramiBasvuruIntroPage';
import { GelisimProgramiBasvuruPage } from './pages/GelisimProgramiBasvuruPage';
import { GelisimProgramiBilgilendirmePage } from './pages/GelisimProgramiBilgilendirmePage';
import { GelisimProgramiPaymentPage } from './pages/GelisimProgramiPaymentPage';
import { GelisimProgramiHavalePage } from './pages/GelisimProgramiHavalePage';
import { HomePage } from './pages/HomePage';
import { TekSeferlikPage } from './pages/TekSeferlikPage';
import { TekSeferlikPaymentPage } from './pages/TekSeferlikPaymentPage';
import { TekSeferlikHavalePage } from './pages/TekSeferlikHavalePage';
import { OnboardingFormPage } from './pages/OnboardingFormPage';

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
        <Route path="/gelisim-programi/basvuru-bilgi" element={<GelisimProgramiBasvuruIntroPage />} />
        <Route path="/gelisim-programi/basvuru" element={<GelisimProgramiBasvuruPage />} />
        <Route
          path="/gelisim-programi/bilgilendirme"
          element={<GelisimProgramiBilgilendirmePage />}
        />
        <Route path="/gelisim-programi/odeme" element={<GelisimProgramiPaymentPage />} />
        <Route path="/gelisim-programi/odeme/havale" element={<GelisimProgramiHavalePage />} />
        <Route path="/basvuru" element={<OnboardingFormPage />} />
      </Routes>
    </BrowserRouter>
  );
}
