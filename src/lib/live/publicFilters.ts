import type { Prisma } from "@/generated/prisma";

export function publicLiveSessionWhere(
  where: Prisma.LiveSessionWhereInput = {},
): Prisma.LiveSessionWhereInput {
  return {
    ...where,
    NOT: [
      ...(Array.isArray(where.NOT) ? where.NOT : where.NOT ? [where.NOT] : []),
      { currentPage: { startsWith: "/admin" } },
      { referrer: { contains: "/admin" } },
    ],
  };
}

export function publicLiveEventWhere(
  where: Prisma.LiveEventWhereInput = {},
): Prisma.LiveEventWhereInput {
  return {
    ...where,
    NOT: [
      ...(Array.isArray(where.NOT) ? where.NOT : where.NOT ? [where.NOT] : []),
      { page: { startsWith: "/admin" } },
      { session: { is: { currentPage: { startsWith: "/admin" } } } },
      { session: { is: { referrer: { contains: "/admin" } } } },
    ],
  };
}
