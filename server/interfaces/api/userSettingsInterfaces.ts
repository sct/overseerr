export interface UserSettingsGeneralResponse {
  username?: string;
  locale?: string;
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
  notificationAgents: number;
  emailEnabled?: boolean;
  webPushEnabled?: boolean;
  pgpKey?: string;
  discordEnabled?: boolean;
  discordId?: string;
  telegramEnabled?: boolean;
  telegramBotUsername?: string;
  telegramChatId?: string;
  telegramSendSilently?: boolean;
}
