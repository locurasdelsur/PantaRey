"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MessageCircle,
  Send,
  Users,
  Hash,
  Music,
  Calendar,
  Camera,
  Lightbulb,
  CheckSquare,
  Smile,
  Paperclip,
  MoreVertical,
} from "lucide-react"
import Image from "next/image"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { MobileNav } from "@/components/mobile-nav"
import { driveDataManager } from "@/lib/drive-data-manager"
import type { Message } from "@/lib/drive-data-manager"

const channels = [
  { id: "general", name: "General", icon: Hash, description: "Conversación general de la banda" },
  { id: "musica", name: "Música", icon: Music, description: "Discusión sobre canciones y arreglos" },
  { id: "eventos", name: "Eventos", icon: Calendar, description: "Coordinación de ensayos y conciertos" },
  { id: "fotos", name: "Fotos", icon: Camera, description: "Compartir fotos y videos" },
  { id: "ideas", name: "Ideas", icon: Lightbulb, description: "Lluvia de ideas creativas" },
  { id: "tareas", name: "Tareas", icon: CheckSquare, description: "Organización y seguimiento" },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [activeChannel, setActiveChannel] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
    const user = localStorage.getItem("currentUser")
    if (user) {
      setCurrentUser(JSON.parse(user))
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const loadedMessages = await driveDataManager.getMessages()
      setMessages(loadedMessages)
    } catch (error) {
      console.error("Error loading messages:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser) return

    const message: Message = {
      id: Date.now(),
      author: currentUser.name,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      channel: activeChannel,
    }

    try {
      const updatedMessages = [...messages, message]
      setMessages(updatedMessages)
      await driveDataManager.saveMessages(updatedMessages)
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
    }
  }

  const getChannelMessages = () => {
    return messages
      .filter((msg) => msg.channel === activeChannel)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  const getActiveChannelInfo = () => {
    return channels.find((ch) => ch.id === activeChannel) || channels[0]
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? "Ahora" : `${diffInMinutes}m`
    } else if (diffInHours < 24) {
      return `${diffInHours}h`
    } else {
      return date.toLocaleDateString()
    }
  }

  const getChannelStats = () => {
    const channelCounts = channels.map((channel) => ({
      ...channel,
      messageCount: messages.filter((msg) => msg.channel === channel.id).length,
      lastMessage: messages
        .filter((msg) => msg.channel === channel.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0],
    }))

    return channelCounts
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando chat...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const channelStats = getChannelStats()
  const channelMessages = getChannelMessages()
  const activeChannelInfo = getActiveChannelInfo()

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image src="/logo.png" alt="Panta Rei Project" width={50} height={50} className="drop-shadow-lg" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-indigo-500" />
                    Chat de la Banda
                  </h1>
                  <p className="text-slate-600 text-sm">Comunicación en tiempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">3 miembros conectados</span>
                </div>
                <UserMenu />
                <MobileNav />
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Sidebar - Channels */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Hash className="h-5 w-5 text-slate-600" />
                    Canales
                  </CardTitle>
                  <CardDescription className="text-slate-600">Selecciona un canal para chatear</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {channelStats.map((channel) => {
                    const Icon = channel.icon
                    const isActive = activeChannel === channel.id
                    return (
                      <button
                        key={channel.id}
                        onClick={() => setActiveChannel(channel.id)}
                        className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                          isActive
                            ? "bg-indigo-100 border-indigo-200 border"
                            : "bg-slate-50 hover:bg-slate-100 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                            <span className={`font-medium ${isActive ? "text-indigo-800" : "text-slate-700"}`}>
                              {channel.name}
                            </span>
                          </div>
                          {channel.messageCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {channel.messageCount}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-xs mt-1 ${isActive ? "text-indigo-600" : "text-slate-500"}`}>
                          {channel.description}
                        </p>
                        {channel.lastMessage && (
                          <p className={`text-xs mt-1 ${isActive ? "text-indigo-500" : "text-slate-400"}`}>
                            Último: {formatTime(channel.lastMessage.timestamp)}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Main Chat Area */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-full flex flex-col">
                {/* Chat Header */}
                <CardHeader className="border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <activeChannelInfo.icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-slate-800"># {activeChannelInfo.name}</CardTitle>
                        <CardDescription className="text-slate-600">{activeChannelInfo.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{channelMessages.length} mensajes</Badge>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {channelMessages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-800 mb-2">No hay mensajes aún</h3>
                      <p className="text-slate-600">Sé el primero en escribir en #{activeChannelInfo.name}</p>
                    </div>
                  ) : (
                    channelMessages.map((message, index) => {
                      const prevMessage = channelMessages[index - 1]
                      const showAvatar = !prevMessage || prevMessage.author !== message.author
                      const isCurrentUser = currentUser && message.author === currentUser.name

                      return (
                        <div key={message.id} className={`flex gap-3 ${showAvatar ? "mt-4" : "mt-1"}`}>
                          {showAvatar ? (
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  message.author,
                                )}&background=f59e0b&color=fff`}
                              />
                              <AvatarFallback className="bg-amber-500 text-white text-xs">
                                {getUserInitials(message.author)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-8 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            {showAvatar && (
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`font-medium text-sm ${
                                    isCurrentUser ? "text-amber-600" : "text-slate-800"
                                  }`}
                                >
                                  {message.author}
                                </span>
                                <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                                {isCurrentUser && (
                                  <Badge variant="secondary" className="text-xs">
                                    Tú
                                  </Badge>
                                )}
                              </div>
                            )}
                            <div
                              className={`text-slate-700 text-sm leading-relaxed ${
                                !showAvatar ? "ml-0" : ""
                              } break-words`}
                            >
                              {message.content}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>

                {/* Message Input */}
                <div className="border-t border-slate-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Escribir en #${activeChannelInfo.name}...`}
                        className="pr-20 bg-slate-50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
                        autoComplete="off"
                        disabled={!currentUser}
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Smile className="h-4 w-4 text-slate-400" />
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Paperclip className="h-4 w-4 text-slate-400" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || !currentUser}
                      className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span>Presiona Enter para enviar</span>
                    {currentUser && (
                      <span className="flex items-center gap-1">
                        Conectado como <strong>{currentUser.name}</strong>
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
