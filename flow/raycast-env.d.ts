/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `index` command */
  export type Index = ExtensionPreferences & {}
  /** Preferences accessible in the `github-search` command */
  export type GithubSearch = ExtensionPreferences & {}
  /** Preferences accessible in the `fork-internal-search` command */
  export type ForkInternalSearch = ExtensionPreferences & {}
  /** Preferences accessible in the `hn-search` command */
  export type HnSearch = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `index` command */
  export type Index = {}
  /** Arguments passed to the `github-search` command */
  export type GithubSearch = {}
  /** Arguments passed to the `fork-internal-search` command */
  export type ForkInternalSearch = {}
  /** Arguments passed to the `hn-search` command */
  export type HnSearch = {}
}

