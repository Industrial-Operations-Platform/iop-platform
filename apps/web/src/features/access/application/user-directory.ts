import type { UserProfile } from "../domain/access";

export type UserSortField = "user" | "profile" | "status";
export interface UserSort {
  field: UserSortField;
  direction: "asc" | "desc";
}

export function cycleUserSort(
  sort: UserSort[],
  field: UserSortField,
): UserSort[] {
  const current = sort.find((criterion) => criterion.field === field);
  if (!current) return [...sort, { field, direction: "asc" }];
  return current.direction === "asc"
    ? sort.map((criterion) =>
        criterion.field === field
          ? { ...criterion, direction: "desc" }
          : criterion,
      )
    : sort.filter((criterion) => criterion.field !== field);
}

export function selectUsers(
  users: UserProfile[],
  search: string,
  sort: UserSort[],
  value: (user: UserProfile, field: UserSortField) => string,
  compare: (left: string, right: string) => number,
): UserProfile[] {
  const query = search.trim().toLowerCase();
  return users
    .filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query),
    )
    .sort((left, right) => {
      for (const { field, direction } of sort) {
        const difference = compare(value(left, field), value(right, field));
        if (difference) return direction === "asc" ? difference : -difference;
      }
      return 0;
    });
}
