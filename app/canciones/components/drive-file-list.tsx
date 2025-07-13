"use client"

import { useState, useEffect } from "react"

interface File {
  id: string
  name: string
  mimeType: string
  webContentLink: string
}

interface DriveFileListProps {
  folderId: string
  title: string
}

export default function DriveFileList({ folderId, title }: DriveFileListProps) {
  const [files, setFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFiles = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Replace with your actual API endpoint
        const response = await fetch(`/api/drive?folderId=${folderId}`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setFiles(data.files)
      } catch (e: any) {
        setError(`Failed to fetch files: ${e.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [folderId])

  if (isLoading) {
    return <p>Loading files from Google Drive...</p>
  }

  if (error) {
    return <p>Error: {error}</p>
  }

  return (
    <div>
      <h3>{title}</h3>
      <ul>
        {files.map((file) => (
          <li key={file.id}>
            <a href={file.webContentLink} target="_blank" rel="noopener noreferrer">
              {file.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
