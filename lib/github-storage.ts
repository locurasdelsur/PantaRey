interface GitHubConfig {
  owner: string
  repo: string
  token: string
  branch: string
}

class GitHubStorage {
  private config: GitHubConfig

  constructor() {
    this.config = {
      owner: process.env.NEXT_PUBLIC_GITHUB_OWNER || "tu-usuario",
      repo: process.env.NEXT_PUBLIC_GITHUB_REPO || "panta-rei-data",
      token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || "",
      branch: "main",
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `token ${this.config.token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getFile(path: string) {
    try {
      const data = await this.makeRequest(`contents/${path}`)
      const content = atob(data.content.replace(/\n/g, ""))
      return {
        content: JSON.parse(content),
        sha: data.sha,
      }
    } catch (error) {
      console.log(`File ${path} not found, will create new`)
      return {
        content: null,
        sha: null,
      }
    }
  }

  async saveFile(path: string, content: any, sha?: string) {
    const encodedContent = btoa(JSON.stringify(content, null, 2))

    const body: any = {
      message: `Update ${path} - ${new Date().toISOString()}`,
      content: encodedContent,
      branch: this.config.branch,
    }

    if (sha) {
      body.sha = sha
    }

    return await this.makeRequest(`contents/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
    })
  }

  // Métodos específicos para cada tipo de datos
  async getUsers() {
    const result = await this.getFile("data/users.json")
    return result.content || []
  }

  async saveUsers(users: any[]) {
    const { sha } = await this.getFile("data/users.json")
    return await this.saveFile("data/users.json", users, sha)
  }

  async getSongs() {
    const result = await this.getFile("data/songs.json")
    return result.content || []
  }

  async saveSongs(songs: any[]) {
    const { sha } = await this.getFile("data/songs.json")
    return await this.saveFile("data/songs.json", songs, sha)
  }

  async getTasks() {
    const result = await this.getFile("data/tasks.json")
    return result.content || []
  }

  async saveTasks(tasks: any[]) {
    const { sha } = await this.getFile("data/tasks.json")
    return await this.saveFile("data/tasks.json", tasks, sha)
  }

  async getEvents() {
    const result = await this.getFile("data/events.json")
    return result.content || []
  }

  async saveEvents(events: any[]) {
    const { sha } = await this.getFile("data/events.json")
    return await this.saveFile("data/events.json", events, sha)
  }

  async getMessages() {
    const result = await this.getFile("data/messages.json")
    return result.content || []
  }

  async saveMessages(messages: any[]) {
    const { sha } = await this.getFile("data/messages.json")
    return await this.saveFile("data/messages.json", messages, sha)
  }

  async getIdeas() {
    const result = await this.getFile("data/ideas.json")
    return result.content || []
  }

  async saveIdeas(ideas: any[]) {
    const { sha } = await this.getFile("data/ideas.json")
    return await this.saveFile("data/ideas.json", ideas, sha)
  }

  async getPhotoSessions() {
    const result = await this.getFile("data/photo-sessions.json")
    return result.content || []
  }

  async savePhotoSessions(photoSessions: any[]) {
    const { sha } = await this.getFile("data/photo-sessions.json")
    return await this.saveFile("data/photo-sessions.json", photoSessions, sha)
  }
}

export const githubStorage = new GitHubStorage()
