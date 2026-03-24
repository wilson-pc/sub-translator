import { useTranslation } from "react-i18next";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-8 text-gray-100">
      <h1 className="mb-2 text-3xl font-bold">{t("legal.terms.title")}</h1>
      <p className="mb-8 text-sm text-gray-400">{t("legal.terms.updated")}</p>

      <p className="mb-8 text-gray-300">{t("legal.terms.intro")}</p>

      <div className="space-y-8">
        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.terms.sections.serviceTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.terms.sections.serviceBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.terms.sections.userKeysTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.terms.sections.userKeysBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.terms.sections.responsibilityTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.terms.sections.responsibilityBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.terms.sections.availabilityTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.terms.sections.availabilityBody")}
          </p>
        </article>

        <article>
          <h2 className="mb-2 text-xl font-semibold">
            {t("legal.terms.sections.liabilityTitle")}
          </h2>
          <p className="text-gray-300">
            {t("legal.terms.sections.liabilityBody")}
          </p>
        </article>
      </div>
    </section>
  );
}
