import { getUserSubscription } from "@/features/billing/server/subscription";
import { getUsageSummary } from "@/features/billing/server/usage";
import { prisma } from "@/lib/db";
import { UserSettings } from "../types";

export async function getUserSettings(userId: string): Promise<UserSettings> {
    // These three don't depend on each other, so run them at the same time.
    const [user, subscription, usage] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      }),
      getUserSubscription(userId),
      getUsageSummary(userId),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    return {
      profile: {
        name: user.name,
        email: user.email,
        image: user.image,
        memberSince: user.createdAt.toISOString(),
      },
      subscription,
      usage,
    };
  }