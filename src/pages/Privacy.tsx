import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Privacy() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("legal.privacy.title")} – SubTranslator`;
  }, [t]);

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 text-gray-100">
      <h1 className="mb-2 text-3xl font-bold">{t("legal.privacy.title")}</h1>
      <p className="mb-8 text-sm text-gray-400">{t("legal.privacy.updated")}</p>

      <p className="mb-8 text-gray-300">{t("legal.privacy.intro")}</p>

      <div className="space-y-8">
        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.privacy.sections.localDataTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.privacy.sections.localDataBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.privacy.sections.filesTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.privacy.sections.filesBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.privacy.sections.providersTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.privacy.sections.providersBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.privacy.sections.retentionTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.privacy.sections.retentionBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.privacy.sections.contactTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.privacy.sections.contactBody")}
          </p>
        </article>
      </div>
    </section>
  );
}
