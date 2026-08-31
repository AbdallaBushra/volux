import { auth } from "../firebase/firebase";

const DEFAULT_LOCAL_API_BASE = "http://127.0.0.1:5001/volux-db1/us-central1/api";
const DEFAULT_PROD_API_BASE = "https://volux-backend.onrender.com";

const resolveApiBase = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }

  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return DEFAULT_LOCAL_API_BASE;
  }

  return DEFAULT_PROD_API_BASE;
};

const API_BASE = resolveApiBase().replace(/\/+$/, "");

const fallbackMessage = {
  en: "Unexpected API response.",
  ar: "استجابة API غير متوقعة.",
};

const buildFallbackEnvelope = (override = {}) => ({
  ok: false,
  code: "API_UNKNOWN_ERROR",
  message: fallbackMessage,
  data: null,
  errors: [],
  meta: {
    requestId: "client-fallback",
    timestamp: new Date().toISOString(),
  },
  ...override,
});

export const getLocalizedApiMessage = (envelope, language = "en") => {
  if (!envelope || typeof envelope !== "object") {
    return language === "ar" ? fallbackMessage.ar : fallbackMessage.en;
  }

  const message = envelope.message || fallbackMessage;
  return language === "ar" ? (message.ar || message.en) : (message.en || message.ar);
};

const safeParseEnvelope = async (response) => {
  try {
    const parsed = await response.json();
    if (!parsed || typeof parsed !== "object") {
      return buildFallbackEnvelope({
        code: "API_INVALID_PAYLOAD",
      });
    }

    const meta = parsed.meta || {};
    return {
      ok: Boolean(parsed.ok),
      code: typeof parsed.code === "string" ? parsed.code : "API_UNKNOWN",
      message: parsed.message || fallbackMessage,
      data: parsed.data ?? null,
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
      meta: {
        requestId: meta.requestId || "client-generated",
        timestamp: meta.timestamp || new Date().toISOString(),
      },
    };
  } catch (error) {
    return buildFallbackEnvelope({
      code: "API_PARSE_ERROR",
      message: {
        en: "Failed to parse API response.",
        ar: "تعذر تحليل استجابة API.",
      },
      errors: [{ message: error?.message || "Unknown parse error" }],
    });
  }
};

const getAuthHeader = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return {};
  }
  const token = await currentUser.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

export const apiRequest = async (path, options = {}) => {
  const {
    method = "GET",
    body,
    headers = {},
    authRequired = true,
  } = options;

  try {
    const authHeaders = authRequired ? await getAuthHeader() : {};
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const envelope = await safeParseEnvelope(response);
    if (!response.ok && envelope.ok) {
      return {
        ...envelope,
        ok: false,
      };
    }

    return envelope;
  } catch (error) {
    return buildFallbackEnvelope({
      code: "NETWORK_ERROR",
      message: {
        en: "Network request failed.",
        ar: "فشل الاتصال بالشبكة.",
      },
      errors: [{ message: error?.message || "Network error" }],
    });
  }
};
