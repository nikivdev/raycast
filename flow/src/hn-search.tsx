import { Action, ActionPanel, Icon, List } from "@raycast/api"
import { useCachedPromise } from "@raycast/utils"
import React, { useMemo, useState } from "react"

interface HNItem {
  id: number
  title: string
  url?: string
  score: number
  by: string
  descendants?: number
}

const HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json"
const HN_ITEM = "https://hacker-news.firebaseio.com/v0/item"

async function fetchTopStories(): Promise<HNItem[]> {
  const response = await fetch(HN_TOP_STORIES)
  if (!response.ok) {
    throw new Error(`Failed to fetch top stories: ${response.status}`)
  }

  const ids = (await response.json()) as number[]
  const top30 = ids.slice(0, 30)

  const items = await Promise.all(
    top30.map(async (id) => {
      const itemResponse = await fetch(`${HN_ITEM}/${id}.json`)
      return itemResponse.json() as Promise<HNItem>
    })
  )

  return items.filter((item) => item && item.title)
}

export default function HNSearchCommand() {
  const [searchText, setSearchText] = useState("")

  const { data: stories = [], isLoading } = useCachedPromise(fetchTopStories, [], {
    keepPreviousData: true,
  })

  const filteredStories = useMemo(() => {
    if (!searchText.trim()) {
      return stories
    }
    const query = searchText.toLowerCase()
    return stories.filter(
      (story) =>
        story.title.toLowerCase().includes(query) ||
        story.by.toLowerCase().includes(query)
    )
  }, [stories, searchText])

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Filter HN front page posts..."
      onSearchTextChange={setSearchText}
      searchText={searchText}
    >
      {filteredStories.map((story, index) => {
        const hnUrl = `https://news.ycombinator.com/item?id=${story.id}`

        return (
          <List.Item
            key={story.id}
            title={story.title}
            subtitle={story.by}
            icon={Icon.Document}
            accessories={[
              { text: `${story.score} pts` },
              { text: `${story.descendants ?? 0} comments` },
            ]}
            actions={
              <ActionPanel>
                {story.url && (
                  <Action.OpenInBrowser url={story.url} title="Open Article" />
                )}
                <Action.OpenInBrowser
                  url={hnUrl}
                  title="Open HN Discussion"
                  shortcut={{ modifiers: ["cmd"], key: "h" }}
                />
                <Action.CopyToClipboard
                  content={story.url ?? hnUrl}
                  title="Copy URL"
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}
