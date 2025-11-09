import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, profile }) {
      // First time user logs in
      if (account) {
        token.id = profile?.sub;
        token.email = profile?.email;
        token.name = profile?.name;
        token.picture = profile?.picture;
      }
      return token;
    },

    async session({ session, token }) {
      // Expose token fields to session.user
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.name = token.name as string;
      session.user.image = token.picture as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
