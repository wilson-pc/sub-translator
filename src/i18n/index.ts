import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const supportedLanguages = ["en", "es"] as const;
const appLanguageStorageKey = "appLanguage";

type SupportedLanguage = (typeof supportedLanguages)[number];

function detectBrowserLanguage(): SupportedLanguage {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const browserLanguage = navigator.languages?.[0] ?? navigator.language;
  const normalizedLanguage = browserLanguage.toLowerCase().split("-")[0];

  return supportedLanguages.includes(normalizedLanguage as SupportedLanguage)
    ? (normalizedLanguage as SupportedLanguage)
    : "en";
}

function getInitialLanguage(): SupportedLanguage {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLanguage = localStorage.getItem(appLanguageStorageKey);

  if (
    storedLanguage &&
    supportedLanguages.includes(storedLanguage as SupportedLanguage)
  ) {
    return storedLanguage as SupportedLanguage;
  }

  return detectBrowserLanguage();
}

function syncDocumentLanguage(language: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = language;
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(appLanguageStorageKey, language);
  }
}

const resources = {
  en: {
    translation: {
      app: {
        name: "Sub Translator",
      },
      layout: {
        languageSwitcherLabel: "Interface language",
        nav: {
          home: "Home",
          about: "About",
          contact: "Contact",
        },
      },
      footer: {
        tagline: "Fast and efficient subtitle translations",
        links: "Links",
        legal: "Legal",
        privacy: "Privacy",
        terms: "Terms of service",
        rights: "All rights reserved.",
      },
      common: {
        save: "Save",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        confirm: "Confirm",
        retry: "Retry",
        download: "Download",
        view: "View",
        translate: "Translate",
        model: "Model",
        family: "Family",
        apiKey: "API Key",
        selectOption: "Select an option",
        default: "Default",
      },
      home: {
        dropzone: "Drag your files here or click",
        targetLanguageLabel: "Translate to",
        targetLanguageHelp:
          "Select the destination language and regional variant for the subtitle output.",
        fileTarget: "Target: {{language}}",
        status: {
          pending: "PENDING",
        },
        unresolvedTooltip: "Contains unresolved lines",
        noApiKeyTitle: "No API key configured",
        noApiKeyLink: "Configure your API key here",
      },
      keys: {
        title: "Configure a model",
      },
      edit: {
        originalPlaceholder: "Original text",
        translationPlaceholder: "Translation",
        errorContains: "Error: contains [[error]]",
        addRow: "Add row",
        deleteRow: "Delete row",
      },
      legal: {
        terms: {
          title: "Terms of service",
          updated: "Last updated: March 23, 2026",
          intro:
            "Sub Translator is a subtitle translation tool. By using the app, you accept these terms.",
          sections: {
            serviceTitle: "1. Service description",
            serviceBody:
              "The app processes subtitle files selected by the user and generates translated subtitle text. Outputs may contain mistakes and should be reviewed before use.",
            userKeysTitle: "2. User API keys",
            userKeysBody:
              "You provide your own API keys for third-party AI providers. Keys are stored in your browser local storage and are managed by you.",
            responsibilityTitle: "3. User responsibilities",
            responsibilityBody:
              "You are responsible for complying with the terms of the AI providers you connect, and for having rights to the subtitle files you upload and translate.",
            availabilityTitle: "4. Availability and changes",
            availabilityBody:
              "The service can change at any time, including features, models, prompts, or integrations, without prior notice.",
            liabilityTitle: "5. Liability limitation",
            liabilityBody:
              "The service is provided as is, without warranties. We are not liable for losses, damages, or inaccuracies resulting from translated outputs or external model behavior.",
          },
        },
        privacy: {
          title: "Privacy policy",
          updated: "Last updated: March 23, 2026",
          intro:
            "This policy explains how Sub Translator handles data when you use the app.",
          sections: {
            localDataTitle: "1. Data stored in your browser",
            localDataBody:
              "API keys, selected model settings, and interface preferences are stored locally in your browser using local storage and IndexedDB.",
            filesTitle: "2. Subtitle file processing",
            filesBody:
              "Subtitle files are processed in the app to prepare translation requests. The translated and original subtitle content may be sent to the AI provider selected by you.",
            providersTitle: "3. Third-party providers",
            providersBody:
              "When you translate, requests are sent to third-party APIs such as Gemini, OpenAI-compatible services, or Anthropic using your own credentials. Their privacy policies apply.",
            retentionTitle: "4. Retention and deletion",
            retentionBody:
              "You can remove your stored API keys and subtitle data from your browser at any time by clearing app data or browser storage.",
            contactTitle: "5. Contact",
            contactBody:
              "If you need legal or privacy updates, review this page periodically because terms and policy text may be updated.",
          },
        },
      },
    },
  },
  es: {
    translation: {
      app: {
        name: "Sub Translator",
      },
      layout: {
        languageSwitcherLabel: "Idioma de la interfaz",
        nav: {
          home: "Inicio",
          about: "Acerca de",
          contact: "Contacto",
        },
      },
      footer: {
        tagline: "Traducciones de subtitulos rapidas y eficientes",
        links: "Enlaces",
        legal: "Legal",
        privacy: "Privacidad",
        terms: "Terminos de servicio",
        rights: "Todos los derechos reservados.",
      },
      common: {
        save: "Guardar",
        cancel: "Cancelar",
        edit: "Editar",
        delete: "Borrar",
        confirm: "Confirmar",
        retry: "Volver a intentar",
        download: "Descargar",
        view: "Ver",
        translate: "Traducir",
        model: "Modelo",
        family: "Familia",
        apiKey: "API Key",
        selectOption: "Selecciona una opcion",
        default: "Por defecto",
      },
      home: {
        dropzone: "Arrastra tus archivos aqui o haz click",
        targetLanguageLabel: "Traducir a",
        targetLanguageHelp:
          "Selecciona el idioma de destino y su variante regional para la salida de subtitulos.",
        fileTarget: "Destino: {{language}}",
        status: {
          pending: "PENDIENTE",
        },
        unresolvedTooltip: "Contiene lineas sin resolver",
        noApiKeyTitle: "No hay API key configurada",
        noApiKeyLink: "Configura tu API key aqui",
      },
      keys: {
        title: "Configura un modelo",
      },
      edit: {
        originalPlaceholder: "Texto original",
        translationPlaceholder: "Traduccion",
        errorContains: "Error: contiene [[error]]",
        addRow: "Agregar fila",
        deleteRow: "Borrar fila",
      },
      legal: {
        terms: {
          title: "Terminos de servicio",
          updated: "Ultima actualizacion: 23 de marzo de 2026",
          intro:
            "Sub Translator es una herramienta para traducir archivos de subtitulos. Al usar la app, aceptas estos terminos.",
          sections: {
            serviceTitle: "1. Descripcion del servicio",
            serviceBody:
              "La app procesa archivos de subtitulos seleccionados por el usuario y genera texto traducido. Los resultados pueden contener errores y deben revisarse antes de usarse.",
            userKeysTitle: "2. API keys del usuario",
            userKeysBody:
              "Tu proporcionas tus propias API keys de proveedores de IA externos. Esas keys se guardan en el navegador del usuario y son administradas por ti.",
            responsibilityTitle: "3. Responsabilidades del usuario",
            responsibilityBody:
              "Eres responsable de cumplir los terminos de los proveedores de IA que conectes y de tener derechos sobre los archivos de subtitulos que subes y traduces.",
            availabilityTitle: "4. Disponibilidad y cambios",
            availabilityBody:
              "El servicio puede cambiar en cualquier momento, incluyendo funciones, modelos, prompts o integraciones, sin aviso previo.",
            liabilityTitle: "5. Limitacion de responsabilidad",
            liabilityBody:
              "El servicio se proporciona tal cual, sin garantias. No somos responsables por perdidas, danos o inexactitudes derivadas de traducciones o del comportamiento de modelos externos.",
          },
        },
        privacy: {
          title: "Politica de privacidad",
          updated: "Ultima actualizacion: 23 de marzo de 2026",
          intro:
            "Esta politica explica como Sub Translator maneja los datos cuando usas la app.",
          sections: {
            localDataTitle: "1. Datos guardados en tu navegador",
            localDataBody:
              "Las API keys, configuraciones de modelo y preferencias de interfaz se guardan localmente en tu navegador usando local storage e IndexedDB.",
            filesTitle: "2. Procesamiento de archivos de subtitulos",
            filesBody:
              "Los archivos de subtitulos se procesan en la app para preparar solicitudes de traduccion. El contenido original y traducido puede enviarse al proveedor de IA que selecciones.",
            providersTitle: "3. Proveedores de terceros",
            providersBody:
              "Cuando traduces, las solicitudes se envian a APIs de terceros como Gemini, servicios compatibles con OpenAI o Anthropic usando tus propias credenciales. Se aplican sus politicas de privacidad.",
            retentionTitle: "4. Retencion y eliminacion",
            retentionBody:
              "Puedes eliminar tus API keys y datos de subtitulos guardados en cualquier momento limpiando los datos de la app o el almacenamiento del navegador.",
            contactTitle: "5. Contacto",
            contactBody:
              "Si necesitas actualizaciones legales o de privacidad, revisa esta pagina periodicamente porque los terminos y politicas pueden actualizarse.",
          },
        },
      },
    },
  },
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

syncDocumentLanguage(initialLanguage);
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
