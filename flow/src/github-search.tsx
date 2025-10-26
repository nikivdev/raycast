import { Action, ActionPanel, Icon, List } from "@raycast/api"
import { useCachedPromise } from "@raycast/utils"
import React, { useState } from "react"
import { useDebouncedValue } from "./use-debounced-value"

interface GitHubRepo {
  id: number
  full_name: string
  description: string | null
  html_url: string
  stargazers_count: number
  language: string | null
}

interface GitHubSearchResponse {
  items?: GitHubRepo[]
}

const GITHUB_SEARCH_ENDPOINT =
  "https://api.github.com/search/repositories?per_page=10&q="

async function searchGitHub(query: string): Promise<GitHubRepo[]> {
  if (!query.trim()) {
    return []
  }

  const response = await fetch(
    `${GITHUB_SEARCH_ENDPOINT}${encodeURIComponent(query)}`
  )

  if (!response.ok) {
    throw new Error(`GitHub search failed with status ${response.status}`)
  }

  const data = (await response.json()) as GitHubSearchResponse | null

  if (!data?.items || !Array.isArray(data.items)) {
    return []
  }

  return data.items
}

export default function GitHubSearchCommand() {
  const [searchText, setSearchText] = useState("")
  const debouncedSearch = useDebouncedValue(searchText, 300)

  const {
    data: repositories = [],
    isLoading,
    error,
  } = useCachedPromise(searchGitHub, [debouncedSearch], {
    execute: debouncedSearch.trim().length > 0,
    keepPreviousData: true,
  })

  const hasSearchText = searchText.trim().length > 0
  const hasResults = repositories.length > 0

  return (
    <List
      isLoading={isLoading && hasSearchText}
      searchBarPlaceholder="Search GitHub repositories"
      onSearchTextChange={setSearchText}
      searchText={searchText}
    >
      {!hasSearchText && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search GitHub"
          description="Type a keyword to search repositories"
        />
      )}

      {error && hasSearchText && (
        <List.Section title="Status">
          <List.Item
            id="error"
            title="Failed to load repositories"
            subtitle={error instanceof Error ? error.message : "Unknown error"}
            icon={Icon.ExclamationMark}
          />
        </List.Section>
      )}

      {hasResults && (
        <List.Section title="Repositories">
          {repositories.map((repo) => {
            const accessories: List.Item.Accessory[] = []

            if (repo.language) {
              accessories.push({ text: repo.language })
            }
            accessories.push({
              text: `★ ${repo.stargazers_count.toLocaleString()}`,
            })

            return (
              <List.Item
                key={repo.id}
                title={repo.full_name}
                subtitle={repo.description ?? undefined}
                icon={Icon.Text}
                accessories={accessories}
                actions={
                  <ActionPanel>
                    <Action.Open
                      target={repo.html_url}
                      application="Dia"
                      title="Open in Dia"
                    />
                  </ActionPanel>
                }
              />
            )
          })}
        </List.Section>
      )}
    </List>
  )
}
