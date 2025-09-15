export type SupportedPackageManager = 'npm';
export type AuditorOptions = 'yarn' | 'npm';
export type AuditLevelOptions = 'info' | 'low' | 'moderate' | 'high' | 'critical' | 'none' | null;

export interface NPMGlobalDep {
  version: string;
}

export interface NPMGlobalDeps {
  dependencies: Record<string, NPMGlobalDep>;
}

export interface MinimalPackageJSON {
  dependencies: Record<string, string>;
}

export interface TempLocations {
  tmpDir: string;
  packageJSON: string;
}

export interface AuditResult {
  message: string;
  exitCode: number;
}
