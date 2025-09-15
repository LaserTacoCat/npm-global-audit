import { command } from 'execa';
import { ERROR_AUDIT_FAILED, ERROR_YARN_RELATIVE_FILES } from './const';
import { globalPackageJSON } from './deps';
import { createTempLocations, pruneTempLocation, saveMinimalPackageJSON } from './fs';
import { AuditLevelOptions, AuditorOptions, AuditResult } from './types';

const defaultAuditResult: AuditResult = {
  message: 'Audit performed successfully. No issues were found.',
  exitCode: 0,
};

export async function performAudit(auditor: AuditorOptions, auditLevel: AuditLevelOptions): Promise<AuditResult> {
  const temps = await createTempLocations();
  const packageJSON = await globalPackageJSON('npm');
  await saveMinimalPackageJSON(temps.packageJSON, packageJSON);
  switch (auditor) {
    case 'yarn':
      return runWithYarn(temps.tmpDir, auditLevel);
    case 'npm':
      return runWithNPM(temps.tmpDir, auditLevel);
    default:
      return defaultAuditResult;
  }
}

async function runWithYarn(cwd: string, auditLevel: AuditLevelOptions): Promise<AuditResult> {
  const auditResult: AuditResult = {
    ...defaultAuditResult,
    message: 'Audit performed successfully. No issues were found.',
    exitCode: 0,
  };

  try {
    console.log('Begin pulling global dependencies with yarn...');
    await command('npx yarn install', { stdin: 'inherit', stdout: 'inherit', stderr: 'pipe', cwd });
    console.log('Completed setup');
    let auditCommand = 'npx yarn audit -y';
    if (auditLevel !== undefined && auditLevel !== null && auditLevel !== 'none') {
      auditCommand = auditCommand.concat(' --severity=', auditLevel.toString());
    }
    await command(auditCommand, { stdin: 'inherit', stdout: 'inherit', stderr: 'pipe', cwd });
  } catch (error) {
    if (error?.message?.includes('refers to a non-existing file')) {
      auditResult.exitCode = ERROR_YARN_RELATIVE_FILES;
      auditResult.message =
        'Encountered a global package defined with relative `file:` protocol dependencies which is known to cause issues for yarn when performing an audit. See https://github.com/yarnpkg/yarn/issues/5735 for more. You can retry the audit using `npm` as the auditor by passing the --auditor=npm flag.';
    } else {
      auditResult.exitCode = ERROR_AUDIT_FAILED;
      auditResult.message = `A module audit found issues. The error level mask was [${error?.exitCode}] - See https://classic.yarnpkg.com/en/docs/cli/audit/#toc-yarn-audit for more.`;
    }
  } finally {
    await pruneTempLocation();
  }

  return auditResult;
}

async function runWithNPM(cwd: string, auditLevel: AuditLevelOptions): Promise<AuditResult> {
  const auditResult: AuditResult = {
    ...defaultAuditResult,
    message: 'Audit performed successfully. No issues were found.',
    exitCode: 0,
  };

  try {
    console.log('Begin pulling global dependencies with npm...');
    await command('npm install', { stdin: 'inherit', stdout: 'inherit', stderr: 'pipe', cwd });
    console.log('Completed setup');
    let auditCommand = 'npm audit';
    if (auditLevel !== undefined && auditLevel !== null && auditLevel !== 'none') {
      auditCommand = auditCommand.concat(' --audit-level=', auditLevel.toString());
    }
    await command(auditCommand, { stdin: 'inherit', stdout: 'inherit', stderr: 'pipe', cwd });
  } catch (error) {
    auditResult.exitCode = ERROR_AUDIT_FAILED;
    auditResult.message = `A module audit found issues.`;
  } finally {
    await pruneTempLocation();
  }

  return auditResult;
}
