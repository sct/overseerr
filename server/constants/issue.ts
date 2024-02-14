export enum IssueType {
  VIDEO = 1,
  AUDIO = 2,
  MUSIC = 3,
  SUBTITLES = 4,
  OTHER = 5,
}

export enum IssueStatus {
  OPEN = 1,
  RESOLVED = 2,
}

export const IssueTypeName = {
  [IssueType.AUDIO]: 'Audio',
  [IssueType.VIDEO]: 'Video',
  [IssueType.MUSIC]: 'Music',
  [IssueType.SUBTITLES]: 'Subtitle',
  [IssueType.OTHER]: 'Other',
};
