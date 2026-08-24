/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ai8 Work fork: the update feed is served from this project's GitHub Releases
 * (electron-builder channel manifests uploaded alongside the installers), so the
 * built-in `github` provider is used instead of the upstream AionUi CDN.
 */

/**
 * GitHub repo that hosts Ai8 Work releases (owner/repo). Override at runtime
 * with the AIONUI_GITHUB_REPO environment variable if the repo moves.
 */
export const GITHUB_REPO = process.env.AIONUI_GITHUB_REPO || 'wmhbcy8/Ai8-Work';

export type CdnFeedOptions = {
  provider: 'github';
  owner: string;
  repo: string;
};

export function buildCdnFeedOptions(): CdnFeedOptions {
  const [owner, repo] = GITHUB_REPO.split('/');
  return { provider: 'github', owner, repo };
}
