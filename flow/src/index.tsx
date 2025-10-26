import { Action, ActionPanel, Icon, List } from "@raycast/api"
import { useCachedPromise } from "@raycast/utils"
import React, { useState } from "react"
import { useDebouncedValue } from "./use-debounced-value"

const YOUTUBE_SUGGESTIONS_ENDPOINT =
  "https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q="

async function fetchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) {
    return []
  }

  const response = await fetch(
    `${YOUTUBE_SUGGESTIONS_ENDPOINT}${encodeURIComponent(query)}`
  )
  if (!response.ok) {
    throw new Error(`Suggestion request failed with status ${response.status}`)
  }

  const rawPayload = (await response.text()).trim()
  const jsonpPrefix = "window.google.ac.h("
  const jsonpSuffix = rawPayload.endsWith(");") ? ");" : ")"

  if (
    !rawPayload.startsWith(jsonpPrefix) ||
    !rawPayload.endsWith(jsonpSuffix)
  ) {
    throw new Error("Unexpected suggestion response format")
  }

  const jsonPayload = rawPayload.slice(
    jsonpPrefix.length,
    rawPayload.length - jsonpSuffix.length
  )

  let data: unknown
  try {
    data = JSON.parse(jsonPayload)
  } catch (error) {
    throw new Error("Failed to parse suggestion response")
  }

  if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[1])) {
    return []
  }

  return (data[1] as unknown[])
    .map((item) => {
      if (typeof item === "string") {
        return item
      }
      if (Array.isArray(item) && typeof item[0] === "string") {
        return item[0]
      }
      return undefined
    })
    .filter((item): item is string => Boolean(item))
}

function getYouTubeSearchUrl(term: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(
    term
  )}`
}

export default function Command() {
  const [searchText, setSearchText] = useState("")
  const debouncedSearch = useDebouncedValue(searchText, 250)

  const {
    data: suggestions = [],
    isLoading,
    error,
  } = useCachedPromise(fetchSuggestions, [debouncedSearch], {
    execute: debouncedSearch.trim().length > 0,
    keepPreviousData: true,
  })

  const hasSuggestions = suggestions.length > 0
  const hasSearchText = searchText.trim().length > 0

  return (
    <List
      isLoading={isLoading && hasSearchText}
      searchBarPlaceholder="Search YouTube"
      onSearchTextChange={setSearchText}
      searchText={searchText}
    >
      {!hasSearchText && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search YouTube"
          description="Start typing to see suggestions"
        />
      )}

      {hasSearchText && (
        <List.Section title="Search">
          <List.Item
            id="direct-search"
            title={searchText}
            icon={Icon.MagnifyingGlass}
            accessories={[{ text: "Search YouTube" }]}
            actions={
              <ActionPanel>
                <Action.Open
                  target={getYouTubeSearchUrl(searchText)}
                  application="Dia"
                  title="Open in Dia"
                />
              </ActionPanel>
            }
          />
        </List.Section>
      )}

      {error && hasSearchText && (
        <List.Section title="Status">
          <List.Item
            id="error"
            title="Failed to load suggestions"
            subtitle={error instanceof Error ? error.message : "Unknown error"}
            icon={Icon.ExclamationMark}
          />
        </List.Section>
      )}

      {hasSuggestions && (
        <List.Section title="Suggestions">
          {suggestions.map((suggestion) => (
            <List.Item
              key={suggestion}
              title={suggestion}
              icon={Icon.Text}
              actions={
                <ActionPanel>
                  <Action.Open
                    target={getYouTubeSearchUrl(suggestion)}
                    application="Dia"
                    title="Open in Dia"
                  />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
    </List>
  )
}
