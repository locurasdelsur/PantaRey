"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Users, Clock, Music, Smile } from "lucide-react"
import Image from "next/image"

interface ChatMessage {
  id: string
  user: string
  message: string
  timestamp: string
  type: "message" | "system"
}

interface User {
  name: string
  instrument: string
  isOnline: boolean
  lastSeen?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [currentUser, setCurrentUser] = useState("")
  const [onlineUsers, setOnlineUsers] = useState<User[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)

  // Load user data and messages
  useEffect(() => {
    const userName = localStorage.getItem("userName") || "Usuario"
    const userInstrument = localStorage.getItem("userInstrument") || "Músico"
    setCurrentUser(userName)

    // Load saved messages
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    } else {
      // Initial welcome message
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        user: "Sistema",
        message: `¡Bienvenido al chat de la banda, ${userName}! 🎵`,
        timestamp: new Date().toISOString(),
        type: "system",
      }
      setMessages([welcomeMessage])
    }

    // Simulate online users
    const mockUsers: User[] = [
      { name: userName, instrument: userInstrument, isOnline: true },
      { name: "Alex", instrument: "Guitarra", isOnline: true },
      { name: "María", instrument: "Bajo", isOnline: false, lastSeen: "Hace 2 horas" },
      { name: "Carlos", instrument: "Batería", isOnline: true },
      { name: "Sofía", instrument: "Voz", isOnline: false, lastSeen: "Ayer" },
    ]
    setOnlineUsers(mockUsers)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Save messages to localStorage
  const saveMessages = (updatedMessages: ChatMessage[]) => {
    setMessages(updatedMessages)
    localStorage.setItem("chatMessages", JSON.stringify(updatedMessages))
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim()) return

    const message: ChatMessage = {
      id: Date.now().toString(),
      user: currentUser,
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      type: "message",
    }

    const updatedMessages = [...messages, message]
    saveMessages(updatedMessages)
    setNewMessage("")

    // Simulate typing indicator
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)

      // Simulate random responses from band members (for demo)
      if (Math.random() > 0.7) {
        const responses = [
          "¡Genial! 🎸",
          "Totalmente de acuerdo 👍",
          "¿A qué hora ensayamos?",
          "Perfecto, ahí estaré 🥁",
          "¡Suena bien! 🎵",
          "¿Ya tienes la letra lista?",
          "¡Vamos a rockear! 🤘",
        ]

        const randomUser = ["Alex", "Carlos", "Sofía"][Math.floor(Math.random() * 3)]
        const randomResponse = responses[Math.floor(Math.random() * responses.length)]

        const responseMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user: randomUser,
          message: randomResponse,
          timestamp: new Date().toISOString(),
          type: "message",
        }

        setTimeout(() => {
          const newerMessages = [...updatedMessages, responseMessage]
          saveMessages(newerMessages)
        }, 1500)
      }
    }, 2000)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else {
      return date.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  const getMessageBubbleStyle = (user: string) => {
    if (user === currentUser) {
      return "bg-gradient-to-r from-amber-500 to-amber-600 text-white ml-auto"
    } else if (user === "Sistema") {
      return "bg-blue-100 text-blue-800 mx-auto"
    } else {
      return "bg-white border border-slate-200 text-slate-800"
    }
  }

  const onlineCount = onlineUsers.filter((user) => user.isOnline).length

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-100 to-amber-50">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Image src="/logo.png" alt="Panta Rei Project" width={60} height={60} className="drop-shadow-lg" />
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">💬 Chat de la Banda</h1>
              <p className="text-slate-600">Comunícate con tu banda en tiempo real</p>
            </div>
          </div>

          <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-8"></div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Online Users Sidebar */}
            <div className="lg:col-span-1">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Miembros
                    <Badge className="bg-green-100 text-green-800">{onlineCount} en línea</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {onlineUsers.map((user, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                        <div className="relative">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-300 to-slate-400 rounded-full flex items-center justify-center">
                            <Music className="h-5 w-5 text-slate-600" />
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                              user.isOnline ? "bg-green-500" : "bg-slate-400"
                            }`}
                          ></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 truncate">{user.name}</span>
                            {user.name === currentUser && (
                              <Badge variant="secondary" className="text-xs">
                                Tú
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{user.instrument}</div>
                          {!user.isOnline && user.lastSeen && (
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {user.lastSeen}
                            </div>
                          )}
                        </div>
                        {user.isOnline && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Main Area */}
            <div className="lg:col-span-3">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200 shadow-lg h-[600px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                    Chat General
                  </CardTitle>
                </CardHeader>

                {/* Messages Area */}
                <CardContent className="flex-1 flex flex-col min-h-0">
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.user === currentUser
                              ? "justify-end"
                              : message.type === "system"
                                ? "justify-center"
                                : "justify-start"
                          }`}
                        >
                          <div className={`max-w-xs lg:max-w-md rounded-lg p-3 ${getMessageBubbleStyle(message.user)}`}>
                            {message.type === "message" && message.user !== currentUser && (
                              <div className="text-xs font-medium mb-1 text-slate-600">{message.user}</div>
                            )}
                            <div className="text-sm break-words">{message.message}</div>
                            <div
                              className={`text-xs mt-1 ${
                                message.user === currentUser
                                  ? "text-amber-200"
                                  : message.type === "system"
                                    ? "text-blue-600"
                                    : "text-slate-500"
                              }`}
                            >
                              {formatTime(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing Indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-slate-100 rounded-lg p-3 max-w-xs">
                            <div className="flex items-center gap-1">
                              <div className="flex gap-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-500 ml-2">escribiendo...</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                    <div className="flex-1 relative">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe tu mensaje..."
                        autoComplete="off"
                        className="pr-12 border-slate-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-slate-600"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
