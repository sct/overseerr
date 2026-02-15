export function resolveGenreConflicts(
  changingList: string[],
  otherList?: string
): {
  changingList: string | undefined;
  otherList: string | undefined;
  hasConflicts: boolean;
} {
  const hasConflicts = otherList
    ? changingList.some((genre) => otherList.includes(genre))
    : false;

  const cleanedOtherList =
    hasConflicts && otherList
      ? otherList
          .split(',')
          .filter((id) => !changingList.includes(id))
          .join(',') || undefined
      : otherList;

  return {
    changingList: changingList.length > 0 ? changingList.join(',') : undefined,
    otherList: cleanedOtherList,
    hasConflicts,
  };
}
