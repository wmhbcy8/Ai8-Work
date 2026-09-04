/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 *
 * Ai8 Work fork: the update feed is served from this project's GitHub Releases
 * (electron-builder channel manifests uploaded alongside the installers), so the
 * built-in GitHub provider is used instead of the upstream AionUi release CDN.
 * The upstream custom-CDN provider tests were removed together with
 * cdnGenericProvider.ts, which this fork no longer uses.
 */

import { describe, expect, it } from 'vitest';
import { GITHUB_REPO, buildCdnFeedOptions } from '@/process/services/updateFeed';

describe('GitHub update feed options', () => {
  it('builds a github electron-updater provider pointed at the configured repo', () => {
    const [owner, repo] = GITHUB_REPO.split('/');

    expect(buildCdnFeedOptions()).toEqual({ provider: 'github', owner, repo });
  });
});
