import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-800 text-gray-200 mt-auto py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h4 className="text-white text-lg font-semibold mb-4">
              {t("app.name")}
            </h4>
            <p className="text-gray-400">{t("footer.tagline")}</p>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-4">
              {t("footer.links")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#inicio"
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {t("layout.nav.home")}
                </a>
              </li>
              <li>
                <a
                  href="#acerca"
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {t("layout.nav.about")}
                </a>
              </li>
              <li>
                <a
                  href="#contacto"
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {t("layout.nav.contact")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-lg font-semibold mb-4">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {t("footer.privacy")}
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>
            &copy; {currentYear} {t("app.name")}. {t("footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
