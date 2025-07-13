"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, Users, Hash } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Message {
  id: number
  author: string
  content: string
  timestamp: string
  channel: string
}

interface Channel {
  id: string
  name: string
  description: string
  messageCount: number
  lastActivity: string
}

export default function ChatPage() {
  const [channels] = useState<Channel[]>([
    {
      id: "general",
      name: "General",
      description: "Conversaciones generales de la banda",
      messageCount: 45,
      lastActivity: "2025-01-08 15:30",
    },
    {
      id: "shows",
      name: "Shows y Presentaciones",
      description: "Organización de shows y eventos",
      messageCount: 23,
      lastActivity: "2025-01-08 14:20",
    },
    {
      id: "composicion",
      name: "Composición",
      description: "Ideas y desarrollo de nuevas canciones",
      messageCount: 67,
      lastActivity: "2025-01-08 16:45",
    },
    {
      id: "equipos",
      name: "Equipos y Técnico",
      description: "Discusiones sobre equipos y aspectos técnicos",
      messageCount: 12,
      lastActivity: "2025-01-07 19:15",
    },
    {
      id: "grabacion",
      name: "Grabación",
      description: "Todo sobre sesiones de grabación",
      messageCount: 34,
      lastActivity: "2025-01-08 11:30",
    },
  ])

  const [messages, setMessages] = useState<Message[]>([])

  const [activeChannel, setActiveChannel] = useState("general")
  const [newMessage, setNewMessage] = useState("")

  const activeChannelData = channels.find((ch) => ch.id === activeChannel)
  const channelMessages = messages.filter((msg) => msg.channel === activeChannel)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now(),
        author: "Tú", // En una app real, esto vendría del usuario logueado
        content: newMessage,
        timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        channel: activeChannel,
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-800 mb-4 inline-flex items-center gap-2 font-medium"
            >
              ← Volver al Dashboard
            </Link>
            <div className="flex items-center gap-4 mb-4">
              <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
              <div>
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Comunicación</h1>
                <p className="text-slate-600">Conversaciones organizadas por tema</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500">
              <Users className="h-4 w-4" />
              <span className="text-sm">3 miembros online</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Channels Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-gray-700 flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Canales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setActiveChannel(channel.id)}
                      className={`
                        w-full text-left p-3 rounded-lg transition-colors
                        ${
                          activeChannel === channel.id
                            ? "bg-blue-500 text-white hover:bg-blue-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">#{channel.name}</span>
                        <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                          {channel.messageCount}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-75 truncate">{channel.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="shadow-md h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-700 flex items-center gap-2">
                      <Hash className="h-5 w-5" />
                      {activeChannelData?.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500">{activeChannelData?.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-gray-600 border-gray-400">
                      {channelMessages.length} mensajes
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  {channelMessages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {message.author[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">{message.author}</span>
                          <span className="text-xs text-gray-500">{message.timestamp}</span>
                        </div>
                        <p className="text-gray-700">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder={`Mensaje en #${activeChannelData?.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-gray-100 border-gray-300 text-gray-700 flex-1"
                  />
                  <Button onClick={handleSendMessage} className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="font-medium text-gray-800">Mensajes Totales</h3>
                  <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Hash className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="font-medium text-gray-800">Canales Activos</h3>
                  <p className="text-2xl font-bold text-gray-900">{channels.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="font-medium text-gray-800">Miembros Online</h3>
                  <p className="text-2xl font-bold text-gray-900">3</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
