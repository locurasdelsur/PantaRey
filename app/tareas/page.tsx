"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckSquare, Plus, User, Calendar, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Task {
  id: number
  title: string
  description?: string
  status: "todo" | "doing" | "done"
  priority: "low" | "medium" | "high"
  assignee: string
  dueDate?: string
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo" as const,
    priority: "medium" as const,
    assignee: "",
    dueDate: "",
  })

  const members = ["Cholo", "Fernando", "Emanuel"]

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return priority
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "todo":
        return "Por Hacer"
      case "doing":
        return "En Progreso"
      case "done":
        return "Completado"
      default:
        return status
    }
  }

  const handleAddTask = () => {
    const task: Task = {
      id: Date.now(),
      ...newTask,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setTasks([...tasks, task])
    setNewTask({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      assignee: "",
      dueDate: "",
    })
  }

  const moveTask = (taskId: number, newStatus: "todo" | "doing" | "done") => {
    setTasks(tasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)))
  }

  const deleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId))
  }

  const todoTasks = tasks.filter((task) => task.status === "todo")
  const doingTasks = tasks.filter((task) => task.status === "doing")
  const doneTasks = tasks.filter((task) => task.status === "done")

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="bg-white/50 border-gray-200 mb-3">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 text-sm">{task.title}</CardTitle>
          <div className="flex gap-1">
            <Badge className={`${getPriorityColor(task.priority)} text-white border-0 text-xs`}>
              {getPriorityText(task.priority)}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteTask(task.id)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && <p className="text-xs text-gray-500 mb-3">{task.description}</p>}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{task.assignee}</span>
          </div>
          {task.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString("es-ES")}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1 mt-3">
          {task.status !== "todo" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveTask(task.id, "todo")}
              className="text-xs h-6 px-2 border-gray-300 text-gray-500 hover:text-gray-900"
            >
              ← Por Hacer
            </Button>
          )}
          {task.status !== "doing" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveTask(task.id, "doing")}
              className="text-xs h-6 px-2 border-gray-300 text-gray-500 hover:text-gray-900"
            >
              {task.status === "todo" ? "→" : "←"} En Progreso
            </Button>
          )}
          {task.status !== "done" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => moveTask(task.id, "done")}
              className="text-xs h-6 px-2 border-gray-300 text-gray-500 hover:text-gray-900"
            >
              Completar →
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

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
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">Gestión de Tareas</h1>
                <p className="text-slate-600">Organiza las tareas de la banda estilo Kanban</p>
              </div>
            </div>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"></div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Tarea</DialogTitle>
                <DialogDescription className="text-gray-500">Crea una nueva tarea para el equipo</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título de la tarea"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="bg-gray-100 border-gray-200"
                />
                <Textarea
                  placeholder="Descripción (opcional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-gray-100 border-gray-200"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    value={newTask.priority}
                    onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Prioridad" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newTask.assignee}
                    onValueChange={(value) => setNewTask({ ...newTask, assignee: value })}
                  >
                    <SelectTrigger className="bg-gray-100 border-gray-200">
                      <SelectValue placeholder="Asignar a" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 border-gray-200">
                      {members.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="bg-gray-100 border-gray-200"
                />
                <Button
                  onClick={handleAddTask}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Agregar Tarea
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Por Hacer</CardTitle>
              <CheckSquare className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{todoTasks.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">En Progreso</CardTitle>
              <ArrowRight className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{doingTasks.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Completadas</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{doneTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* To Do Column */}
          <div>
            <Card className="bg-white/50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  Por Hacer ({todoTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todoTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {todoTasks.length === 0 && <p className="text-gray-500 text-center py-8">No hay tareas pendientes</p>}
              </CardContent>
            </Card>
          </div>

          {/* Doing Column */}
          <div>
            <Card className="bg-white/50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  En Progreso ({doingTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {doingTasks.length === 0 && <p className="text-gray-500 text-center py-8">No hay tareas en progreso</p>}
              </CardContent>
            </Card>
          </div>

          {/* Done Column */}
          <div>
            <Card className="bg-white/50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Completadas ({doneTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {doneTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {doneTasks.length === 0 && <p className="text-gray-500 text-center py-8">No hay tareas completadas</p>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
