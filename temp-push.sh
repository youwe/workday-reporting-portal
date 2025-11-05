#!/bin/bash
# Auto-answer yes to all prompts
yes "" | pnpm drizzle-kit push --force 2>&1 | head -100
