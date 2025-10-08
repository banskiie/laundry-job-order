// Encode a type and id into a base64 cursor
export const toCursor = (type: string, id: string) =>
  Buffer.from(`${type}:${id}`, "utf8").toString("base64")

// Decode a base64 cursor back to its type and id components
export const fromCursor = (cursor: string) => {
  const decoded = Buffer.from(cursor, "base64").toString("utf8")
  const [type, id] = decoded.split(":")
  return { type, id }
}
