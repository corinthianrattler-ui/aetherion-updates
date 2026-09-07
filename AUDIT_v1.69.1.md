# Aetherion Reforged 1.69.1 — Startup Access Repair

## Outcome

Version 1.69.1 makes the opening menu reachable on every app launch. An existing autosave now produces the title menu with **Continue** and **Game Updates** instead of being loaded before the menu can render. The same updater control remains mounted in the live Systems dock.

## Root cause

The base `render()` function reads the autosave immediately when in-memory state is empty. That made `renderStart()` run only when no autosave existed. Version 1.69.0 correctly mounted an updater button whenever `.startBtns` appeared, but a normal saved installation never created that opening-screen container.

## Repair boundary

- The patch does not remove, rewrite, migrate, or replace the autosave.
- It calls the existing `renderStart()` once after the bundled game and downloaded modules finish loading.
- The existing **Continue** action remains responsible for reading the autosave and entering the game.
- Background speech and music are stopped before the opening menu replaces the automatically rendered game view.
- Both `.startBtns` and `.dockTabs` are observed and repaired after later UI redraws without creating duplicate controls.

## Validation

- Regression coverage verifies that a present autosave opens the title menu exactly once and remains byte-for-byte unchanged.
- Both opening-menu and Systems-dock update buttons are mounted and open the safe updater.
- Re-evaluating the patch is idempotent.
- The stable channel embeds the exact tested patch bytes and matching SHA-256 checksum.
