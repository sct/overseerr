export interface UserSettingsGeneralResponse {
  username?: string;
  region?: string;
  originalLanguage?: string;
}

export interface UserSettingsNotificationsResponse {
  enableNotifications: boolean;
  telegramBotUsername?: string;
  discordId?: string;
  telegramChatId?: string;
  telegramSendSilently?: boolean;
}
