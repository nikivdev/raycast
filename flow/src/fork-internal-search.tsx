import {
  Action,
  ActionPanel,
  Icon,
  List,
  Toast,
  open,
  showToast,
} from "@raycast/api"
import { useCachedPromise } from "@raycast/utils"
import fs from "node:fs/promises"
import type { Dirent } from "node:fs"
import os from "node:os"
import path from "node:path"
import React, { useMemo, useState } from "react"
import { useDebouncedValue } from "./use-debounced-value"

interface GitProject {
  name: string
  path: string
  relativePath: string
}

const ROOT_DIRECTORY = path.join(os.homedir(), "fork-i")
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "vendor",
  "tmp",
  "build",
  "dist",
])
const MAX_DEPTH = 3

async function directoryExists(directoryPath: string) {
  try {
    const stats = await fs.stat(directoryPath)
    return stats.isDirectory()
  } catch {
    return false
  }
}

async function findGitProjects(root: string): Promise<GitProject[]> {
  if (!(await directoryExists(root))) {
    throw new Error(`Directory not found: ${root}`)
  }

  const projects: GitProject[] = []

  async function walk(currentPath: string, depth: number) {
    if (depth > MAX_DEPTH) {
      return
    }

    const gitPath = path.join(currentPath, ".git")

    if (await directoryExists(gitPath)) {
      const relativePath = path.relative(root, currentPath) || "."
      projects.push({
        name: path.basename(currentPath),
        path: currentPath,
        relativePath,
      })
      return
    }

    let entries: Dirent[]
    try {
      entries = await fs.readdir(currentPath, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.isSymbolicLink()) {
        continue
      }

      if (IGNORED_DIRECTORIES.has(entry.name)) {
        continue
      }

      const nextPath = path.join(currentPath, entry.name)
      await walk(nextPath, depth + 1)
    }
  }

  await walk(root, 0)

  projects.sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  return projects
}

export default function ForkInternalSearchCommand() {
  const [searchText, setSearchText] = useState("")
  const debouncedSearch = useDebouncedValue(searchText, 150)

  const {
    data: projects = [],
    isLoading,
    error,
  } = useCachedPromise(findGitProjects, [ROOT_DIRECTORY], {
    keepPreviousData: true,
  })

  const filteredProjects = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) {
      return projects
    }

    return projects.filter((project) => {
      const haystack = `${project.name} ${project.relativePath} ${project.path}`.toLowerCase()
      return haystack.includes(query)
    })
  }, [debouncedSearch, projects])

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search Fork repositories in ~/fork-i"
    >
      {!isLoading && !projects.length && !error && (
        <List.EmptyView
          icon={Icon.Folder}
          title="No repositories found"
          description={`Create a git repository inside ${ROOT_DIRECTORY}`}
        />
      )}

      {error && (
        <List.Section title="Status">
          <List.Item
            id="error"
            title="Failed to load projects"
            subtitle={error instanceof Error ? error.message : "Unknown error"}
            icon={Icon.ExclamationMark}
          />
        </List.Section>
      )}

      {filteredProjects.length > 0 && (
        <List.Section title="Repositories">
          {filteredProjects.map((project) => (
            <List.Item
              key={project.path}
              title={project.name}
              subtitle={
                project.relativePath !== project.name
                  ? project.relativePath
                  : undefined
              }
              accessories={[{ text: project.path }]}
              icon={Icon.Folder}
              actions={
                <ActionPanel>
                  <Action
                    title="Open in Cursor"
                    icon={Icon.AppWindow}
                    onAction={async () => {
                      try {
                        await open(project.path, "/Applications/Cursor.app")
                      } catch (error) {
                        const message =
                          error instanceof Error
                            ? error.message
                            : String(error)
                        await showToast({
                          style: Toast.Style.Failure,
                          title: "Failed to open in Cursor",
                          message,
                        })
                      }
                    }}
                  />
                  <Action.Open title="Open in Finder" target={project.path} />
                  <Action.CopyToClipboard
                    title="Copy Path"
                    content={project.path}
                  />
                  <Action.OpenWith path={project.path} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  )
}
