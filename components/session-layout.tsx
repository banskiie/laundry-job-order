"use client"
import React from "react"
import { SessionProvider } from "next-auth/react"
import { Toaster } from "sonner"
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client"
import { ApolloProvider } from "@apollo/client/react"

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_ADDRESS,
  }),
})

const SessionLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <SessionProvider>
      <ApolloProvider client={client}>
        {children}
        <Toaster
          richColors
          theme="light"
          visibleToasts={1}
          expand
          duration={3000}
          position="bottom-left"
        />
      </ApolloProvider>
    </SessionProvider>
  )
}

export default SessionLayout
