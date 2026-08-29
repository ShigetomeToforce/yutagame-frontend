#!/usr/bin/env -S deno run -A --watch=static/,routes/,islands/,utils/,components/,dev.ts,main.ts,fresh.config.ts

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

await dev(import.meta.url, "./main.ts", config);
