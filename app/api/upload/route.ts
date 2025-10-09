import { NextResponse } from "next/server"
import { google } from "googleapis"
import { Readable } from "stream"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("image") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    // Convert file to a readable stream
    const buffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(buffer)

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    const drive = google.drive({ version: "v3", auth })

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!

    const response = await drive.files.create({
      requestBody: {
        name: new Date().toISOString().replace(/[:.]/g, "-"),
        parents: [folderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: "id",
      supportsAllDrives: true,
    })

    return NextResponse.json(
      {
        message: "✅ File uploaded successfully",
        url: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error("❌ Error uploading file:", error)
    return NextResponse.json(
      { message: "Error uploading file", error: error.message },
      { status: 500 }
    )
  }
}
