export interface UserSettingsGeneralResponse {
  username?: string;
  region?: string;
  originalLanguage?: string;
  movieQuotaLimit?: number;
  movieQuotaDays?: number;
  tvQuotaLimit?: number;
  tvQuotaDays?: number;
  globalMovieQuotaDays?: number;
  globalMovieQuotaLimit?: number;
  globalTvQuotaLimit?: number;
  globalTvQuotaDays?: number;
}

export interface UserSettingsNotificationsResponse {
  enableNotifications: boolean;
  telegramBotUsername?: string;
  discordId?: string;
  telegramChatId?: string;
  telegramSendSilently?: boolean;
  pgpKey?: string;
}
