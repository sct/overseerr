export enum NotificationAgentType {
  NONE = 0,
  EMAIL = 2,
  DISCORD = 4,
  TELEGRAM = 8,
  PUSHOVER = 16,
  PUSHBULLET = 32,
  SLACK = 64,
}

export const hasNotificationAgentEnabled = (
  agent: NotificationAgentType,
  value: number
): boolean => {
  return !!(value & agent);
};
