"use client"
import React, { useEffect, useState } from "react"
import { gql } from "@apollo/client"
import { useQuery } from "@apollo/client/react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { IUser } from "@/types/user.interface"
import { Input } from "@/components/ui/input"
import { TrashIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import UserForm from "./dialogs/form"

const USERS = gql`
  query Users($first: Int!, $search: String) {
    users(first: $first, search: $search) {
      total
      pages
      edges {
        cursor
        node {
          isActive
          role
          username
          name
          _id
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

interface Filter {
  key: string
  value: string | number | boolean | (string | number | boolean)[]
  type: "TEXT" | "NUMBER" | "NUMBER_RANGE" | "DATE" | "DATE_RANGE" | "BOOLEAN"
}

const ROWS_INCREMENT = 5

const Page = () => {
  const { data: session } = useSession()
  const user: IUser & any = session?.user
  const role = user?.role as string
  const [rows, setRows] = useState<number>(ROWS_INCREMENT)
  const [search, setSearch] = useState<string>("")
  const [searchKeyword, setSearchKeyword] = useState<string>("")
  const { data, refetch, loading } = useQuery(USERS, {
    variables: {
      first: rows,
      search,
    },
    fetchPolicy: "network-only",
  })
  const [userRows, setUserRows] = useState<any>([])

  useEffect(() => {
    if (data) setUserRows((data as any).users.edges)
  }, [data])

  return (
    <div className="flex flex-col p-2 gap-2">
      <div className="w-full flex flex-col gap-2">
        <div className="flex">
          <Input
            placeholder="🔍 Search user... "
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchKeyword)
            }}
            className={cn(
              (search || searchKeyword) && "rounded-tr-none rounded-br-none",
              "flex-1 outline-none focus-visible:ring-0"
            )}
          />
          {(search || searchKeyword) && (
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                setSearch("")
                setSearchKeyword("")
              }}
              className="rounded-tl-none rounded-bl-none"
            >
              <TrashIcon />
            </Button>
          )}
        </div>
        <UserForm refetch={refetch} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted-foreground text-center">
          {loading ? (
            "Loading..."
          ) : (
            <span>Showing {userRows.length} results.</span>
          )}
        </span>
        {userRows.map((o: any) => (
          <UserForm key={o.cursor} _id={o.node._id} refetch={refetch}>
            <div
              key={o.cursor}
              className="p-2 border flex gap-2 justify-between"
            >
              <div>
                <span className="block text-sm">Name: {o.node.name}</span>
                <span className="block text-sm">
                  Username: {o.node.username}
                </span>
                <span className="block text-sm">Role: {o.node.role}</span>
                <Badge
                  className={cn(
                    o.node.isActive ? "bg-green-800" : "bg-destructive"
                  )}
                >
                  {o.node.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </UserForm>
        ))}
        {!!(data && (data as any).users.total > rows) && (
          <Button
            variant="link"
            size="lg"
            onClick={() => setRows((p) => p + ROWS_INCREMENT)}
          >
            Load more...
          </Button>
        )}
      </div>
    </div>
  )
}

export default Page
