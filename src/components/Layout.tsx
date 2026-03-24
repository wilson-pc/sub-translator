import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();

  const handleLanguageChange = async (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    await i18n.changeLanguage(event.target.value);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-900 text-gray-100">
      <header className="border-b border-gray-700 bg-gray-800 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl font-bold">{t("app.name")}</h1>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
            <nav className="flex gap-6 md:gap-8">
              <a
                href="/"
                className="text-gray-300 transition-colors hover:text-white"
              >
                {t("layout.nav.home")}
              </a>
              <a
                href="/acerca"
                className="text-gray-300 transition-colors hover:text-white"
              >
                {t("layout.nav.about")}
              </a>
              <a
                href="/contacto"
                className="text-gray-300 transition-colors hover:text-white"
              >
                {t("layout.nav.contact")}
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <label
                htmlFor="app-language"
                className="text-sm text-gray-300 whitespace-nowrap"
              >
                {t("layout.languageSwitcherLabel")}
              </label>
              <select
                id="app-language"
                value={i18n.resolvedLanguage ?? i18n.language}
                onChange={handleLanguageChange}
                className="rounded-md border border-gray-600 bg-gray-900 px-3 py-1.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-8">{children}</main>

      <Footer />
    </div>
  );
}
