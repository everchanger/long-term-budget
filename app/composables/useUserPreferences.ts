export interface UserPreferences {
  locale: "en" | "sv";
  currency: "USD" | "SEK";
}

interface PreferencesApiResponse {
  data: UserPreferences;
}

export const useUserPreferences = () => {
  const nuxtApp = useNuxtApp();
  const $i18n = nuxtApp.$i18n;
  const { useSession } = useAuth();
  const session = useSession();

  // Fetch user preferences from the database
  const {
    data: preferencesResponse,
    refresh: refreshPreferences,
    status,
  } = useFetch<PreferencesApiResponse>("/api/user/preferences", {
    // Only fetch if user is authenticated, use lazy to prevent SSR issues
    lazy: true,
    server: false,
    watch: [session],
  });

  // Current preference values with safe defaults
  const locale = computed<"en" | "sv">(
    () => (preferencesResponse.value?.data?.locale as "en" | "sv") ?? "en"
  );
  const currency = computed<"USD" | "SEK">(
    () => (preferencesResponse.value?.data?.currency as "USD" | "SEK") ?? "USD"
  );

  // Update locale
  const setLocale = async (newLocale: "en" | "sv") => {
    try {
      // Update i18n if available
      if ($i18n?.setLocale) {
        await $i18n.setLocale(newLocale);
      }

      // Update in database
      await $fetch("/api/user/preferences", {
        method: "PATCH",
        body: { locale: newLocale },
      });

      await refreshPreferences();
    } catch (error) {
      console.error("Failed to update locale:", error);
      throw error;
    }
  };

  // Update currency
  const setCurrency = async (newCurrency: "USD" | "SEK") => {
    try {
      // Update in database
      await $fetch("/api/user/preferences", {
        method: "PATCH",
        body: { currency: newCurrency },
      });

      await refreshPreferences();
    } catch (error) {
      console.error("Failed to update currency:", error);
      throw error;
    }
  };

  // Initialize locale from user preferences on mount
  onMounted(async () => {
    try {
      if (
        session.value &&
        preferencesResponse.value?.data?.locale &&
        $i18n?.setLocale
      ) {
        const userLocale = preferencesResponse.value.data.locale;
        if ($i18n.locale?.value && $i18n.locale.value !== userLocale) {
          await $i18n.setLocale(userLocale);
        }
      }
    } catch (error) {
      console.error("Failed to initialize locale:", error);
    }
  });

  return {
    locale,
    currency,
    setLocale,
    setCurrency,
    refreshPreferences,
    status,
  };
};
