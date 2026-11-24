import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { nextCookies } from "better-auth/next-js";
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: { 
    github: { 
      clientId: process.env.GITHUB_CLIENT_ID as string, 
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string, 

      mapProfileToUser:async(profile)=>({
        email:profile.email ?? `${profile.id}@users.noreply.github.com`,
        name:profile.name ?? profile.login,
      })
    }, 
  },

  // Cache the session in a signed cookie for 5 minutes, so getSession()
  // doesn't need a database query on every request.
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

   plugins: [nextCookies()]
});
