const DEFAULT_FLAG_PATH = `${Deno.cwd()}/.maintenance_mode`;

function getFlagPath(): string {
  const customPath = Deno.env.get("MAINTENANCE_FLAG_PATH")?.trim();
  return customPath && customPath.length > 0 ? customPath : DEFAULT_FLAG_PATH;
}

export interface MaintenanceStatus {
  enabled: boolean;
  updatedAt?: string;
  flagPath: string;
}

export async function getMaintenanceStatus(): Promise<MaintenanceStatus> {
  const flagPath = getFlagPath();
  try {
    const info = await Deno.stat(flagPath);
    return {
      enabled: true,
      updatedAt: info.mtime?.toISOString(),
      flagPath,
    };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return { enabled: false, flagPath };
    }
    throw error;
  }
}

export async function enableMaintenanceMode(changedBy?: string): Promise<void> {
  const flagPath = getFlagPath();
  const payload = {
    enabled: true,
    updatedAt: new Date().toISOString(),
    changedBy: changedBy || "unknown",
  };
  await Deno.writeTextFile(flagPath, `${JSON.stringify(payload, null, 2)}\n`);
}

export async function disableMaintenanceMode(): Promise<void> {
  const flagPath = getFlagPath();
  try {
    await Deno.remove(flagPath);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return;
    }
    throw error;
  }
}
