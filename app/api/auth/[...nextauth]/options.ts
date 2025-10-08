import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { ApolloClient, gql, HttpLink, InMemoryCache } from "@apollo/client"
import { IUser } from "@/types/user.interface"

const SIGN_IN = gql`
  mutation SignIn($username: String!, $password: String!) {
    signIn(username: $username, password: $password) {
      _id
      name
      username
      role
      isActive
    }
  }
`

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.NEXT_PUBLIC_GRAPHQL_ADDRESS }),
  cache: new InMemoryCache(),
})

export const options: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials: any): Promise<any> => {
        try {
          const { username, password } = credentials
          const { data }: any = await client.mutate({
            mutation: SIGN_IN,
            variables: {
              username,
              password,
            },
          })
          if (!data?.signIn) throw new Error("Invalid credentials")
          return { user: data?.signIn }
        } catch (error: any) {
          console.error(error)
          throw new Error(
            "Failed to sign in. Please check credentials and try again."
          )
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, trigger, session }: any) => {
      if (user) token.user = user.user
      if (trigger === "update" && session) token.user = session.user
      return token
    },
    session: async ({ session, token }: any) => {
      session.user = token.user
      return session
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(options)
